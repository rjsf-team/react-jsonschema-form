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
import {
  deepEquals,
  isObject,
  logOnce,
  ID_KEY,
  ROOT_SCHEMA_PREFIX,
  schemaKey,
  sharedCopyParts,
  withRootIdRefPrefix,
} from '@rjsf/utils';
import type { ErrorObject, ValidateFunction, Ajv } from 'ajv';

import ajvRootSchemaId from './ajvRootSchemaId.ts';
import createAjvInstance from './createAjvInstance.ts';
import { changesData, copyForValidation } from './dataForValidation.ts';
import localizeErrors from './localizeErrors.ts';
import processRawValidationErrors from './processRawValidationErrors.ts';
import type { CustomValidatorOptionsType, Localizer, SuppressDuplicateFilteringType } from './types.ts';
import withPartIdsUnder from './withPartIdsUnder.ts';

/** The id a root without an `$id` is registered under beside another without one, which takes `ROOT_SCHEMA_PREFIX` */
const ALTERNATE_ROOT_SCHEMA_ID = `${ROOT_SCHEMA_PREFIX}_alternate`;

/** A root `isValid()` checks against */
interface RootRegistration<S extends StrictRJSFSchema> {
  /** The id the root is registered under */
  id: string;
  /** The root reference seen last, or one equal to it */
  schema: S;
  /** The keys of the schemas `isValid()` added under it, compiled against it */
  subschemaIds: Set<string>;
  /** Whether the root holds an `$id` below its own, so that it is held alone */
  alone: boolean;
}

/** `ValidatorType` implementation that uses the AJV 8 validation mechanism.
 */
export default class AJV8Validator<
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> implements ValidatorType<S, F> {
  /** The AJV instance to use for all validations
   *
   * @private
   */
  ajv: Ajv;

  /** The Localizer function to use for localizing Ajv errors
   *
   * @private
   */
  readonly localizer?: Localizer;

  /** Controls which duplicate error filtering is suppressed; see `filterDuplicateErrors`
   *
   * @private
   */
  readonly suppressDuplicateFiltering?: SuppressDuplicateFilteringType;

  /** The roots `isValid()` checked against last, most recent first, at most two: `Form`'s sanitize alternates between
   * the old and new root field by field, and each would otherwise drop what the other compiled. A schema such as
   * `{ $ref: '#/definitions/x' }` means something else under every root, so each root keeps the keys of the schemas
   * `isValid()` added under it, removed with it.
   *
   * @private
   */
  private roots: RootRegistration<S>[] = [];

  /** Whether each function `isValid()` validated with can change the data, see `changesData()`. Ajv compiles a keyword
   * into a function only when it was registered before the function was compiled, so asking once, at the function's
   * first check, covers every keyword the function runs
   *
   * @private
   */
  private readonly changesDataOf = new WeakMap<ValidateFunction, boolean>();

  /** Constructs an `AJV8Validator` instance using the `options`
   *
   * @param options - The `CustomValidatorOptionsType` options that are used to create the AJV instance
   * @param [localizer] - If provided, is used to localize a list of Ajv `ErrorObject`s
   */
  constructor(options: CustomValidatorOptionsType, localizer?: Localizer) {
    const {
      additionalMetaSchemas,
      customFormats,
      ajvOptionsOverrides,
      ajvFormatOptions,
      AjvClass,
      extenderFn,
      suppressDuplicateFiltering,
    } = options;
    this.ajv = createAjvInstance(
      additionalMetaSchemas,
      customFormats,
      ajvOptionsOverrides,
      ajvFormatOptions,
      AjvClass,
      extenderFn,
    );
    this.localizer = localizer;
    this.suppressDuplicateFiltering = suppressDuplicateFiltering;
  }

  /** Resets the internal AJV validator to clear schemas from it. Can be helpful for resetting the validator for tests.
   */
  reset() {
    this.ajv.removeSchema();
    this.roots = [];
  }

  /** Removes the root registered under `id`, the `$id`s it holds and the subschemas compiled against it. Ajv also
   * registers a root under its own `$id`, less an empty fragment, which is not `id` where the `uriResolver` normalizes
   * it, so that registration is dropped too: left in place, it answers a lookup by that `$id` with the root it
   * registered. An `$id` it holds left in place would resolve into whatever root is registered under `id` next.
   *
   * @param id - The id the root is registered under
   * @param [subschemaIds] - The keys of the subschemas `isValid()` added under that root
   */
  private removeRootSchema(id: string, subschemaIds: ReadonlySet<string> = new Set()) {
    const registered = this.ajv.schemas[id]?.schema;
    const ownId = isObject(registered) ? registered[ID_KEY] : undefined;
    if (typeof ownId === 'string') {
      this.ajv.removeSchema(ownId.replace(/#$/, ''));
    }
    this.removeSchemas(new Set([id, ...subschemaIds]));
  }

  /** Removes every root `isValid()` holds and the subschemas compiled against them */
  private removeRoots() {
    this.roots.forEach((root) => this.removeRootSchema(root.id, root.subschemaIds));
    this.roots = [];
  }

  /** Adds `schema`, which Ajv doesn't hold yet, under `schemaId`, for the root it is checked against to remove with
   * it, returning the function Ajv compiled it to
   */
  private addSubschema(schema: S, schemaId: string, root: RootRegistration<S>) {
    // Ajv keys a schema by its `$id` without an empty trailing fragment, so it is removed under that key
    root.subschemaIds.add(schemaId.replace(/#$/, ''));
    const forAjv = withPartIdsUnder(schema, this.ajv.opts.schemaId);
    return this.ajv.addSchema(forAjv, schemaId).getSchema(schemaId) ?? this.ajv.compile(forAjv);
  }

  /** Removes the schemas `isValid()` added under `ids` and every `$id` they hold, such as those of the parts an
   * option's scoring copy holds once, which Ajv registers as the JSON pointer to it in the schema's document,
   * `<id>#/…`, and which removing the schema leaves in place
   */
  private removeSchemas(ids: ReadonlySet<string>) {
    for (const [ref, target] of Object.entries(this.ajv.refs)) {
      if (typeof target === 'string' && ids.has(target.split('#', 1)[0])) {
        this.ajv.removeSchema(ref);
      }
    }
    ids.forEach((id) => this.ajv.removeSchema(id));
  }

  /** Runs the pure validation of the `schema` and `formData` without any of the RJSF functionality. Provided for use
   * by the playground. Returns the `errors` from the validation
   *
   * @param schema - The schema against which to validate the form data
   * @param [formData] - The form data to validate
   */
  rawValidation(schema: S, formData?: unknown): RawValidationResult<ErrorObject> {
    let compilationError: Error | undefined = undefined;
    let compiledValidator: ValidateFunction | undefined;
    try {
      if (schema[ID_KEY]) {
        compiledValidator = this.ajv.getSchema(schema[ID_KEY]);
      }
      compiledValidator ??= this.ajv.compile(schema);
      compiledValidator(formData);
    } catch (err) {
      compilationError = err as Error;
      // AJV registers a schema in its internal cache before running meta-schema
      // validation. When that check throws, the broken schema stays cached so
      // subsequent compile() calls skip revalidation and return silently. Remove
      // the entry so every call with an invalid schema consistently produces a
      // compilation error. For schemas with $id the cache key is the id string;
      // for anonymous schemas AJV uses the object reference as the key.
      // Guard with compiledValidator === undefined so that a runtime error thrown
      // by compiledValidator(formData) does not evict a correctly-compiled schema.
      // A truthy non-string $id makes AJV throw before it caches anything, and
      // removeSchema() would throw on it too, so there is nothing to remove.
      if (compiledValidator === undefined) {
        const id = schema[ID_KEY];
        if (typeof id === 'string') {
          this.ajv.removeSchema(id);
        } else if (!id) {
          this.ajv.removeSchema(schema);
        }
      }
    }

    let errors;
    if (compiledValidator) {
      errors = compiledValidator.errors ?? undefined;
      try {
        if (typeof this.localizer === 'function') {
          localizeErrors(this.localizer, compiledValidator.errors);
        }
      } finally {
        // Clear errors to prevent persistent errors, see #1104
        compiledValidator.errors = null;
      }
    }

    return {
      errors,
      validationError: compilationError,
    };
  }

  /** This function processes the `formData` with an optional user contributed `customValidate` function, which receives
   * the form data and a `errorHandler` function that will be used to add custom validation errors for each field. Also
   * supports a `transformErrors` function that will take the raw AJV validation errors, prior to custom validation and
   * transform them in what ever way it chooses.
   *
   * @param formData - The form data to validate
   * @param schema - The schema against which to validate the form data
   * @param [customValidate] - An optional function that is used to perform custom validation
   * @param [transformErrors] - An optional function that is used to transform errors after AJV validation
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

  /** Registers `rootSchema` for `isValid()` to resolve `$ref`s against, beside the root registered before it, and
   * drops the least recently used root and the subschemas compiled against it once a third arrives. A root equal to
   * one held reuses it, and the deep-equality check is skipped for a `rootSchema` reference seen last time.
   *
   * @param rootSchema - The root schema used to provide $ref resolutions
   */
  handleSchemaUpdate(rootSchema: S): void {
    this.registerRootSchema(rootSchema);
  }

  /** Registers `rootSchema` as `handleSchemaUpdate()` describes, returning the id it is registered under. The id is
   * normalized through the `uriResolver` only when the root changes, since `isValid()` names the root by it on every
   * call.
   *
   * @param rootSchema - The root schema used to provide $ref resolutions
   * @returns - The id the root is registered under
   */
  private registerRootSchema(rootSchema: S): string {
    const [current] = this.roots;
    if (current?.schema === rootSchema) {
      return current.id;
    }
    const held =
      this.roots.find((root) => root.schema === rootSchema) ??
      this.roots.find((root) => deepEquals(rootSchema, root.schema));
    if (held !== undefined) {
      held.schema = rootSchema;
      if (held !== current) {
        this.roots.reverse();
      }
      return held.id;
    }
    const ownId = ajvRootSchemaId(rootSchema, this.ajv.opts.uriResolver);
    // Ajv takes an `$id` once, so a root with one can't be held beside another with the same, while one without takes
    // whichever of two ids the root kept isn't registered under
    const keeps = current !== undefined && !current.alone && (ownId === ROOT_SCHEMA_PREFIX || current.id !== ownId);
    this.roots.slice(keeps ? 1 : 0).forEach((root) => this.removeRootSchema(root.id, root.subschemaIds));
    this.roots = keeps ? [current] : [];
    const id = keeps && current.id === ownId ? ALTERNATE_ROOT_SCHEMA_ID : ownId;
    const refsBefore = { ...this.ajv.refs };
    try {
      if (this.ajv.getSchema(id) === undefined) {
        this.ajv.addSchema(rootSchema, id);
      } else if (!deepEquals(rootSchema, this.ajv.getSchema(id)?.schema)) {
        // No root held is registered under the id, but a schema added to `ajv` with the root's `$id` can be
        this.removeRootSchema(id);
        this.ajv.addSchema(rootSchema, id);
      }
    } catch {
      // A root this instance's dialect rejects, such as a 2020-12 root under the default draft-07 Ajv, is still
      // registered, unvalidated, so a `$ref` into its definitions resolves from the first call on. What was registered
      // under its id is dropped first because comparing against it compiles it, which throws for a rejected root. The
      // root kept is dropped too only when the unvalidated root still throws, a clash with it, such as an `$id` both hold
      this.removeRootSchema(id);
      if (isObject(rootSchema)) {
        try {
          this.ajv.addSchema(rootSchema, id, undefined, false);
        } catch {
          this.removeRoots();
          this.removeRootSchema(id);
          this.ajv.addSchema(rootSchema, id, undefined, false);
        }
      }
    }
    // Ajv registers an `$id` a root holds below its own by the pointer to it in the root registered last, so a root
    // holding one, or kept beside one, would resolve a `$ref` to it into the other root. An anchor or fragment `$id`
    // is registered under the root's own id, so it names only this root
    const alone = Object.entries(this.ajv.refs).some(
      ([ref, target]) => typeof target === 'string' && refsBefore[ref] !== target && !ref.startsWith(`${id}#`),
    );
    if (alone) {
      this.removeRoots();
    }
    this.roots = [{ id, schema: rootSchema, subschemaIds: new Set(), alone }, ...this.roots];
    return id;
  }

  /** Validates data against a schema, returning true if the data is valid, or
   * false otherwise. If the schema is invalid, then this function will return
   * false. Where Ajv can change the data validated, under `useDefaults`, `coerceTypes` or `removeAdditional` or with a
   * keyword registered with `modifying: true`, a copy of the `formData` is validated, so the `formData` itself never
   * changes.
   *
   * @param schema - The schema against which to validate the form data
   * @param formData - The form data to validate
   * @param rootSchema - The root schema used to provide $ref resolutions
   */
  isValid(schema: S, formData: unknown, rootSchema: S) {
    // schemaId and compiled are declared outside the try so the catch block can
    // conditionally remove the broken schema from AJV's registry.
    let schemaId: string | undefined;
    let compiled = false;
    try {
      const rootSchemaId = this.registerRootSchema(rootSchema);
      const [root, other] = this.roots;
      // A `$ref` local to the root, such as the `{ $ref: '#/properties/a/if' }` a form validates a condition with,
      // names the root by the id it is registered under, whatever the schema holding it is registered as
      const schemaWithIdRefPrefix = withRootIdRefPrefix<S>(schema, rootSchema, rootSchemaId);
      schemaId = schemaKey(schemaWithIdRefPrefix);
      // One with an `$id` of its own is keyed by that `$id` whatever root it names, so the other root gives it up
      if (schemaWithIdRefPrefix[ID_KEY] && other !== undefined) {
        const key = schemaId.replace(/#$/, '');
        if (other.subschemaIds.delete(key)) {
          this.removeSchemas(new Set([key]));
        }
      }
      // Add schema by an explicit ID so it can be fetched later
      // Fall back to using compile if necessary
      // https://ajv.js.org/guide/managing-schemas.html#pre-adding-all-schemas-vs-adding-on-demand
      const compiledValidator: ValidateFunction =
        this.ajv.getSchema(schemaId) ?? this.addSubschema(schemaWithIdRefPrefix, schemaId, root);
      compiled = true;
      let changes = this.changesDataOf.get(compiledValidator);
      if (changes === undefined) {
        changes = changesData(this.ajv);
        this.changesDataOf.set(compiledValidator, changes);
      }
      return compiledValidator(changes ? copyForValidation(formData) : formData);
    } catch (e) {
      // The schema is named so two schemas that fail with the same error text aren't deduped into one warning, and
      // `compiled` distinguishes a schema that wouldn't compile from one that did and then threw on the form data,
      // which would otherwise share a key whenever the two errors read alike
      const named = schemaId === undefined ? '' : ` "${schemaId}"`;
      logOnce(
        compiled
          ? `Error encountered validating form data against schema${named}:`
          : `Error encountered compiling schema${named}:`,
        { error: e },
      );
      // Remove the broken schema from AJV's registry so a subsequent rawValidation
      // or isValid call does not silently reuse a cached entry that bypassed
      // meta-schema validation. Guard with !compiled so that a runtime error thrown
      // by compiledValidator(formData) does not evict a correctly-compiled schema.
      if (!compiled && schemaId !== undefined) {
        // Only a schema holding parts it holds once, see `sharedCopyParts()`, has `$id`s registered beside it
        const key = schemaId.replace(/#$/, '');
        if (sharedCopyParts(schema).length === 0) {
          this.ajv.removeSchema(key);
        } else {
          this.removeSchemas(new Set([key]));
        }
      }
      return false;
    }
  }
}
