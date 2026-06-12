import type {
  CustomValidator,
  ErrorTransformer,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
  ValidationData,
  ValidatorType,
} from '@rjsf/utils';
import { deepEquals, hashForSchema, ID_KEY, ROOT_SCHEMA_PREFIX, withIdRefPrefix } from '@rjsf/utils';
import type { ValidationError, Validator } from 'ata-validator';
import cloneDeep from 'lodash/cloneDeep';

import createAtaInstance from './createAtaInstance';
import type { RawValidationErrorsType } from './processRawValidationErrors';
import processRawValidationErrors from './processRawValidationErrors';
import type { CustomValidatorOptionsType, Localizer, SuppressDuplicateFilteringType } from './types';

/** `ValidatorType` implementation backed by `ata-validator`.
 *
 * ata is schema-bound (one `Validator` per schema) rather than instance-with-
 * registry like AJV, so this class maintains its own per-schema-id cache and
 * registers cross-schema dependencies through ata's `addSchema` so `$ref`
 * still resolves between schemas RJSF passes in.
 */
export default class ATAValidator<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
> implements ValidatorType<T, S, F> {
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

  /** Per-schema-id cache of constructed ata `Validator` instances. AJV uses a
   * single instance with a schema registry; ata is schema-bound, so we
   * maintain the registry ourselves.
   */
  private readonly validators = new Map<string, { validator: Validator; schema: object }>();

  /** Most recent `rootSchema` reference seen by `handleSchemaUpdate`, used as
   * a fast-path to skip a deep-equality check when the same root is passed
   * back-to-back.
   */
  private lastSeenRootSchema?: S;

  /** True once a `rootSchema` has been registered in this lifecycle. */
  private hasRegisteredRootSchema = false;

  constructor(options: CustomValidatorOptionsType, localizer?: Localizer) {
    this.options = options;
    this.localizer = localizer;
    this.suppressDuplicateFiltering = options.suppressDuplicateFiltering;
  }

  /** Resets the cached validators and root-schema bookkeeping. Mirrors
   * `AJV8Validator#reset` so RJSF's test harness can flush state between runs.
   */
  reset() {
    this.validators.clear();
    this.lastSeenRootSchema = undefined;
    this.hasRegisteredRootSchema = false;
  }

  /** The most recently registered rootSchema, kept so we can pass it to ata's
   * `schemas` constructor option when building validators for sub-schemas.
   * This is how `$ref` to root-level definitions resolves under ata's
   * per-schema model (vs AJV's single-instance registry).
   */
  private cachedRootSchema?: object;

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
    if (typeof globalThis.structuredClone === 'function') {
      return globalThis.structuredClone(data);
    }
    return cloneDeep(data);
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
    const siblingRoots = this.cachedRootSchema && this.cachedRootSchema !== schema ? [this.cachedRootSchema] : [];
    const optionsWithSchemas = {
      ...this.options,
      ataOptionsOverrides: {
        ...(this.options.ataOptionsOverrides || {}),
        ...(siblingRoots.length ? { schemas: siblingRoots } : {}),
      },
    };
    const validator = createAtaInstance(schema, optionsWithSchemas);
    this.validators.set(id, { validator, schema });
    return validator;
  }

  /** Runs raw validation against the given schema. Equivalent to
   * `AJV8Validator#rawValidation`: returns ata's error array (already in
   * AJV-compatible shape) plus any compilation error encountered.
   */
  rawValidation<Result = any>(schema: S, formData?: T): RawValidationErrorsType<Result> {
    let compilationError: Error | undefined;
    let errors: ValidationError[] | undefined;

    try {
      const id = schema[ID_KEY] ?? hashForSchema(schema);
      const validator = this.getOrBuild(id, schema);
      const result = validator.validate(ATAValidator.cloneForValidation(formData));
      errors = result.valid ? undefined : result.errors;

      if (errors && typeof this.localizer === 'function') {
        // ata freezes `error.params`, so the AJV-validator's pre-quote dance
        // (used to coax `ajv-i18n` into producing quoted property names)
        // can't be applied verbatim. The hook is invoked with the raw
        // ata errors; localizers that mutate `message` in place still work.
        this.localizer(errors);
      }
    } catch (err) {
      compilationError = err as Error;
    }

    return {
      errors: errors as unknown as Result[] | undefined,
      validationError: compilationError,
    };
  }

  /** Validates `formData` and returns RJSF's `ValidationData<T>`. See
   * `processRawValidationErrors` for the shape of the post-processing
   * pipeline (custom validation, transform hook, ui-title resolution).
   */
  validateFormData(
    formData: T | undefined,
    schema: S,
    customValidate?: CustomValidator<T, S, F>,
    transformErrors?: ErrorTransformer<T, S, F>,
    uiSchema?: UiSchema<T, S, F>,
  ): ValidationData<T> {
    const rawErrors = this.rawValidation<ValidationError>(schema, formData);
    return processRawValidationErrors(
      this,
      rawErrors,
      formData,
      schema,
      customValidate,
      transformErrors,
      uiSchema,
      this.suppressDuplicateFiltering,
    );
  }

  /** Registers (or refreshes) the rootSchema in the per-schema registry so
   * subsequent `$ref`-resolving validators can see it. Mirrors AJV's
   * `addSchema(rootSchema, rootSchemaId)` flow.
   */
  handleSchemaUpdate(rootSchema: S): void {
    if (this.lastSeenRootSchema === rootSchema && this.hasRegisteredRootSchema) {
      return;
    }
    const rootSchemaId = rootSchema[ID_KEY] ?? ROOT_SCHEMA_PREFIX;
    // Inject $id into a copy of the rootSchema so ata's schema registry can
    // resolve `<rootSchemaId>#/...` refs produced by `withIdRefPrefix`.
    // The original user-supplied schema is left untouched.
    const rootWithId =
      rootSchema[ID_KEY] === rootSchemaId
        ? (rootSchema as object)
        : { ...(rootSchema as object), [ID_KEY]: rootSchemaId };
    this.cachedRootSchema = rootWithId;
    const cached = this.validators.get(rootSchemaId);
    if (!cached || !deepEquals(cached.schema, rootWithId)) {
      this.getOrBuild(rootSchemaId, rootWithId);
    }
    this.lastSeenRootSchema = rootSchema;
    this.hasRegisteredRootSchema = true;
  }

  /** Boolean validation entrypoint. Returns false on validation failure or
   * compilation error. Mirrors `AJV8Validator#isValid` semantics.
   */
  isValid(schema: S, formData: T | undefined, rootSchema: S) {
    try {
      this.handleSchemaUpdate(rootSchema);
      const schemaWithIdRefPrefix = withIdRefPrefix<S>(schema) as S;
      const id = schemaWithIdRefPrefix[ID_KEY] ?? hashForSchema(schemaWithIdRefPrefix);
      const validator = this.getOrBuild(id, schemaWithIdRefPrefix);
      return validator.validate(ATAValidator.cloneForValidation(formData)).valid;
    } catch (e) {
      // oxlint-disable-next-line no-console
      console.warn('Error encountered compiling schema:', e);
      return false;
    }
  }
}
