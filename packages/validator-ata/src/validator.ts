import type {
  CustomValidator,
  ErrorTransformer,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  ValidationData,
  ValidatorType,
  RawValidationResult,
} from '@rjsf/utils';
import { deepEquals, logOnce, ID_KEY, rootSchemaIdOf, schemaKey, withRootIdRefPrefix } from '@rjsf/utils';
import type { ValidationError, Validator } from 'ata-validator';

import createAtaInstance, { ANCHOR_ID_REGEX } from './createAtaInstance.ts';
import localizeErrors from './localizeErrors.ts';
import processRawValidationErrors from './processRawValidationErrors.ts';
import { isDraft04, schemaList } from './schemaList.ts';
import type { CustomValidatorOptionsType, Localizer, SuppressDuplicateFilteringType } from './types.ts';

/** ata reads a fragment-only `$id` such as `#root` as the schema's anchor, but drops it where the schema already has
 * an `$anchor` of another name, and loses it where the `$id` is replaced, so a `$ref: '#root'` names nothing. Returns
 * `schema` carrying that anchor: as its `$anchor` where it has none, else on an alias under `$defs` that refers to the
 * document.
 *
 * @param schema - The schema handed to ata
 * @param id - The `$id` the schema was given, which `schema` may no longer carry
 */
function withFragmentIdAnchor<T extends object>(schema: T, id: unknown): T {
  if (typeof id !== 'string' || !ANCHOR_ID_REGEX.test(id)) {
    return schema;
  }
  const name = id.slice(1);
  const { $anchor, $defs } = schema as { $anchor?: unknown; $defs?: object };
  if ($anchor === undefined) {
    return { ...schema, $anchor: name };
  }
  if ($anchor === name) {
    return schema;
  }
  return { ...schema, $defs: { ...$defs, __rjsf_fragmentId: { $anchor: name, allOf: [{ $ref: '#' }] } } };
}

/** Constructed ata `Validator`s by schema id, with the schema each was built from */
type ValidatorCache = Map<string, { validator: Validator; schema: object }>;

/** `ValidatorType` implementation backed by `ata-validator`.
 *
 * ata is schema-bound (one `Validator` per schema) rather than instance-with-
 * registry like AJV, so this class maintains its own per-schema-id cache and
 * registers cross-schema dependencies through ata's `addSchema` so `$ref`
 * still resolves between schemas RJSF passes in.
 */
export default class ATAValidator<
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> implements ValidatorType<S, F> {
  /** Stable copy of the constructor options, used when (re)building per-schema
   * `Validator` instances on demand.
   *
   * @private
   */
  readonly options: CustomValidatorOptionsType;

  /** The Localizer function applied to ata errors before they are returned.
   *
   * @private
   */
  readonly localizer?: Localizer;

  /** Controls which duplicate error filtering is suppressed; see
   * `processRawValidationErrors#filterDuplicateErrors`.
   *
   * @private
   */
  readonly suppressDuplicateFiltering?: SuppressDuplicateFilteringType;

  /** Per-schema-id cache of constructed ata `Validator` instances, those of the root registered last. AJV uses a
   * single instance with a schema registry; ata is schema-bound, so we
   * maintain the registry ourselves.
   */
  private validators: ValidatorCache = new Map();

  /** The roots registered last, most recent first, at most two, each with the validators built beside it: `Form`'s
   * sanitize alternates between the old and new root field by field, and each would otherwise drop what the other
   * built. `schema` is the reference seen last, which skips the deep-equality check when it comes back.
   */
  private roots: { schema: S; withId: object; validators: ValidatorCache }[] = [];

  constructor(options: CustomValidatorOptionsType, localizer?: Localizer) {
    this.options = options;
    this.localizer = localizer;
    this.suppressDuplicateFiltering = options.suppressDuplicateFiltering;
  }

  /** Resets the cached validators and root-schema bookkeeping. Mirrors
   * `AJV8Validator#reset` so RJSF's test harness can flush state between runs.
   */
  reset() {
    this.validators = new Map();
    this.roots = [];
    this.cachedRootSchema = undefined;
    this.extras = undefined;
  }

  /** The most recently registered rootSchema, kept so we can pass it to ata's
   * `schemas` constructor option when building validators for sub-schemas.
   * This is how `$ref` to root-level definitions resolves under ata's
   * per-schema model (vs AJV's single-instance registry).
   */
  private cachedRootSchema?: object;

  /** The extra schemas given to the validators of one root (see `extrasFor`). */
  private extras?: { base: object; own: object[]; withRoot: object[]; metas?: object[] };

  /** The caller's `ataOptionsOverrides.schemas` as a list, by whether the root is draft-04. */
  private ownLists: object[][] = [];

  /** Returns a structural copy of `formData` so ata's default-applier
   * (which writes `default` values into the input object during validation)
   * doesn't leak a mutation back to the caller. RJSF probes the same data
   * through `isValid` repeatedly while resolving oneOf/anyOf options, and
   * a mutated probe changes subsequent answers, so the wrapper has to
   * preserve referential purity that AJV provides by default.
   */
  private static cloneForValidation<D>(data: D): D {
    if (data === null || typeof data !== 'object') {
      return data;
    }
    return structuredClone(data);
  }

  /** The extra schemas for the validators of a form whose root is `base`, all of them built from
   * one list, so the root and every sub-schema read the caller's documents by the same rules, the
   * module's too (see `schemaList`): `own`, the caller's `ataOptionsOverrides.schemas` as a list,
   * for the root's validator; `withRoot`, the same and then the root, for a sub-schema's, so the
   * root wins over an entry with its `$id`; and `metas`, the caller's `additionalMetaSchemas`
   * without one that has the root's `$id`, since a sub-schema's validator adds those after the root
   * and one would replace it. The list depends on the root (whether it is draft-04), so it is
   * built once per root and reused, which also lets ata reuse its caches, kept per object. A record
   * entry under the empty key is left out: in a list it would need an empty `$id`, which ata
   * rejects.
   */
  private extrasFor(base: object) {
    if (this.extras?.base !== base) {
      const draft04 = isDraft04(base, false);
      const own = this.ownLists[Number(draft04)] ?? schemaList(this.options.ataOptionsOverrides?.schemas, draft04);
      this.ownLists[Number(draft04)] = own;
      const baseId = (base as { $id?: unknown }).$id;
      const metas = this.options.additionalMetaSchemas?.filter(
        (meta) => (meta as { $id?: unknown } | null)?.$id !== baseId,
      );
      this.extras = { base, own, withRoot: [...own, base], metas };
    }
    return this.extras;
  }

  /** Returns the cached ata `Validator` for the given id, or builds and
   * caches a new one. When a rootSchema has been registered via
   * `handleSchemaUpdate`, it is supplied as a sibling schema so `$ref` to
   * the root resolves regardless of which sub-schema is being validated.
   */
  private getOrBuild(id: string, schema: object): Validator {
    const existing = this.validators.get(id);
    if (existing && deepEquals(existing.schema, schema)) {
      return existing.validator;
    }
    // Pass the rootSchema as a sibling so `$ref` to its definitions resolves.
    // Skip when the schema itself is the root, otherwise ata sees a
    // self-referential addition.
    const root = this.cachedRootSchema && this.cachedRootSchema !== schema ? this.cachedRootSchema : undefined;
    const extras = this.extrasFor(root ?? schema);
    let schemas: object[] | undefined;
    if (root) {
      schemas = extras.withRoot;
    } else if (this.options.ataOptionsOverrides?.schemas !== undefined) {
      schemas = extras.own;
    }
    const optionsWithSchemas = {
      ...this.options,
      ...(root ? { additionalMetaSchemas: extras.metas } : {}),
      ataOptionsOverrides: { ...this.options.ataOptionsOverrides, ...(schemas ? { schemas } : {}) },
    };
    const { $schema: dialect } = (root ?? {}) as { $schema?: unknown };
    const read =
      typeof dialect === 'string' && (schema as { $schema?: unknown }).$schema === undefined
        ? { $schema: dialect, ...schema }
        : schema;
    const validator = createAtaInstance(read, optionsWithSchemas);
    this.validators.set(id, { validator, schema });
    return validator;
  }

  /** Runs raw validation against the given schema. Equivalent to
   * `AJV8Validator#rawValidation`: returns ata's error array (already in
   * AJV-compatible shape) plus any compilation error encountered.
   *
   * @param schema - The schema against which to validate the form data
   * @param [formData] - The form data to validate
   */
  rawValidation(schema: S, formData?: unknown): RawValidationResult<ValidationError> {
    let compilationError: Error | undefined;
    let errors: ValidationError[] | undefined;

    try {
      const id = schemaKey(schema);
      const validator = this.getOrBuild(id, withFragmentIdAnchor(schema, schema[ID_KEY]));
      const result = validator.validate(ATAValidator.cloneForValidation(formData));
      errors = result.valid ? undefined : result.errors;

      if (errors && typeof this.localizer === 'function') {
        localizeErrors(this.localizer, errors);
      }
    } catch (err) {
      compilationError = err as Error;
    }

    return {
      errors,
      validationError: compilationError,
    };
  }

  /** Validates `formData` and returns RJSF's `ValidationData<T>`. See
   * `processRawValidationErrors` for the shape of the post-processing
   * pipeline (custom validation, transform hook, ui-title resolution).
   *
   * @param formData - The form data to validate
   * @param schema - The schema against which to validate the form data
   * @param [customValidate] - An optional function that is used to perform custom validation
   * @param [transformErrors] - An optional function that is used to transform errors after ata validation
   * @param [uiSchema] - An optional uiSchema that is passed to `transformErrors` and `customValidate`
   * @param [getCustomValidateFormData] - Returns the `formData` to hand `customValidate`, with the form's
   *        defaults applied; left out, they are computed here with the default `allOf` merge
   */
  validateFormData<T = unknown>(
    formData: T | undefined,
    schema: S,
    customValidate?: CustomValidator<T, S, F>,
    transformErrors?: ErrorTransformer<T, S, F>,
    uiSchema?: UiSchema<T, S, F>,
    getCustomValidateFormData?: () => T,
  ): ValidationData<T> {
    const rawErrors = this.rawValidation(schema, formData);
    return processRawValidationErrors(
      { validator: this },
      rawErrors,
      formData,
      schema,
      customValidate,
      transformErrors,
      uiSchema,
      this.suppressDuplicateFiltering,
      getCustomValidateFormData,
    );
  }

  /** Registers (or refreshes) the rootSchema in the per-schema registry so
   * subsequent `$ref`-resolving validators can see it. Mirrors AJV's
   * `addSchema(rootSchema, rootSchemaId)` flow.
   */
  handleSchemaUpdate(rootSchema: S): void {
    const [current] = this.roots;
    if (current?.schema === rootSchema) {
      return;
    }
    const seen = this.roots.find((root) => root.schema === rootSchema);
    if (seen !== undefined) {
      this.useRoot(seen);
      return;
    }
    const rootSchemaId = rootSchemaIdOf(rootSchema);
    // Inject $id into a copy of the rootSchema so ata's schema registry can
    // resolve `<rootSchemaId>#/...` refs produced by `withRootIdRefPrefix`.
    // The original user-supplied schema is left untouched.
    const ownId: unknown = rootSchema[ID_KEY];
    // A `$ref: '#root'` in the root, prefixed to `<rootSchemaId>#root` by `withRootIdRefPrefix`, still has to find the
    // anchor ata read the replaced fragment-only `$id` as
    const rootWithId =
      ownId === rootSchemaId
        ? (rootSchema as object)
        : withFragmentIdAnchor({ ...(rootSchema as object), [ID_KEY]: rootSchemaId }, ownId);
    // Compared with the roots registered rather than with the validator cached under its id, which
    // `rawValidation()` of a root that was not registered builds beside the registered one
    const equal = this.roots.find((root) => deepEquals(root.withId, rootWithId));
    if (equal !== undefined) {
      equal.schema = rootSchema;
      this.useRoot(equal);
      return;
    }
    // Every validator resolves its `$ref`s against the root it was built beside, so a schema such as
    // `{ $ref: '#/definitions/x' }`, which means something else under every root, is built again for this one
    this.useRoot({ schema: rootSchema, withId: rootWithId, validators: new Map() });
    this.getOrBuild(rootSchemaId, rootWithId);
  }

  /** Makes `root` the one validators are built beside, dropping the least recently used beyond two */
  private useRoot(root: (typeof this.roots)[number]) {
    this.roots = [root, ...this.roots.filter((other) => other !== root)].slice(0, 2);
    this.validators = root.validators;
    this.cachedRootSchema = root.withId;
  }

  /** Boolean validation entrypoint. Returns false on validation failure or
   * compilation error. Mirrors `AJV8Validator#isValid` semantics.
   */
  isValid(schema: S, formData: unknown, rootSchema: S) {
    // Declared outside the try so the catch block can say which schema the error is about
    let id: string | undefined;
    try {
      this.handleSchemaUpdate(rootSchema);
      const schemaWithIdRefPrefix = withRootIdRefPrefix<S>(schema, rootSchema);
      id = schemaKey(schemaWithIdRefPrefix);
      const validator = this.getOrBuild(id, schemaWithIdRefPrefix);
      return validator.validate(ATAValidator.cloneForValidation(formData)).valid;
    } catch (e) {
      // The schema is named so two schemas that fail with the same error text aren't deduped into one warning. Which of
      // the schema and the form data is at fault is deliberately not claimed: ata doesn't check the whole schema when
      // the validator is built, so a schema defect such as an unparseable `pattern` throws from `validate()` and would
      // be reported as a problem with the data
      const named = id === undefined ? '' : ` "${id}"`;
      logOnce(`Error encountered validating schema${named}:`, { error: e });
      return false;
    }
  }
}
