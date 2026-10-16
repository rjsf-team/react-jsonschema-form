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
import { deepEquals, isObject, logOnce, ID_KEY, rootSchemaIdOf, schemaKey, withRootIdRefPrefix } from '@rjsf/utils';
import type { ErrorObject, ValidateFunction, Ajv } from 'ajv';

import createAjvInstance from './createAjvInstance.ts';
import type { RawValidationErrorsType } from './processRawValidationErrors.ts';
import processRawValidationErrors from './processRawValidationErrors.ts';
import type { CustomValidatorOptionsType, Localizer, SuppressDuplicateFilteringType } from './types.ts';

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

  /** Most recent `rootSchema` reference processed by `handleSchemaUpdate`.
   *
   * @private
   */
  private lastSeenRootSchema?: S;

  /** True once a `rootSchema` has been registered with Ajv in this lifecycle.
   *
   * @private
   */
  private hasRegisteredRootSchema = false;

  /** The keys `isValid()` added schemas to Ajv under. A schema such as `{ $ref: '#/definitions/x' }` means something
   * else under every root, so they are removed whenever the root registered under the same id is replaced.
   *
   * @private
   */
  private readonly subschemaIds = new Set<string>();

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
    this.subschemaIds.clear();
    this.lastSeenRootSchema = undefined;
    this.hasRegisteredRootSchema = false;
  }

  /** Replaces the root registered under `rootSchemaId` with `rootSchema`, dropping the subschemas compiled against the
   * one it replaces
   *
   * @param rootSchema - The root schema to register
   * @param rootSchemaId - The id to register it under
   * @param validate - Whether Ajv validates the root against its meta-schema
   */
  private replaceRootSchema(rootSchema: S, rootSchemaId: string, validate: boolean) {
    this.ajv.removeSchema(rootSchemaId);
    this.subschemaIds.forEach((id) => this.ajv.removeSchema(id));
    this.subschemaIds.clear();
    if (isObject(rootSchema)) {
      this.ajv.addSchema(rootSchema, rootSchemaId, undefined, validate);
    }
  }

  /** Runs the pure validation of the `schema` and `formData` without any of the RJSF functionality. Provided for use
   * by the playground. Returns the `errors` from the validation
   *
   * @param schema - The schema against which to validate the form data
   * @param [formData] - The form data to validate
   */
  rawValidation<Result = any>(schema: S, formData?: unknown): RawValidationErrorsType<Result> {
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
      if (typeof this.localizer === 'function') {
        // Properties need to be enclosed with quotes so that
        // `AJV8Validator#transformRJSFValidationErrors` replaces property names
        // with `title` or `ui:title`. See #4348, #4349, #4387, and #4402.
        (compiledValidator.errors ?? []).forEach((error) => {
          ['missingProperty', 'property'].forEach((key) => {
            if (error.params?.[key]) {
              // oxlint-disable-next-line no-param-reassign
              error.params[key] = `'${error.params[key]}'`;
            }
          });
          if (typeof error.params?.deps === 'string') {
            // As `error.params.deps` is the comma+space separated list of missing dependencies, enclose each dependency separately.
            // For example, `A, B` is converted into `'A', 'B'`.
            // oxlint-disable-next-line no-param-reassign
            error.params.deps = error.params.deps
              .split(', ')
              .map((v) => `'${v}'`)
              .join(', ');
          }
        });
        this.localizer(compiledValidator.errors);
        // Revert to originals
        (compiledValidator.errors ?? []).forEach((error) => {
          ['missingProperty', 'property'].forEach((key) => {
            const quoted: unknown = error.params?.[key];
            if (typeof quoted === 'string') {
              // oxlint-disable-next-line no-param-reassign
              error.params[key] = quoted.slice(1, -1);
            }
          });
          if (typeof error.params?.deps === 'string') {
            // Remove surrounding quotes from each missing dependency. For example, `'A', 'B'` is reverted to `A, B`.
            // oxlint-disable-next-line no-param-reassign
            error.params.deps = error.params.deps
              .split(', ')
              .map((v) => v.slice(1, -1))
              .join(', ');
          }
        });
      }
      errors = compiledValidator.errors ?? undefined;

      // Clear errors to prevent persistent errors, see #1104
      compiledValidator.errors = null;
    }

    return {
      errors: errors as unknown as Result[],
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
    const rawErrors = this.rawValidation<ErrorObject>(schema, formData);
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

  /**
   * This function checks if a schema needs to be added and if the root schemas don't match it removes the old root schema from the ajv instance and adds the new one.
   * When called repeatedly with the same `rootSchema` reference the deep-equality check is skipped.
   *
   * @param rootSchema - The root schema used to provide $ref resolutions
   */
  handleSchemaUpdate(rootSchema: S): void {
    if (this.lastSeenRootSchema === rootSchema && this.hasRegisteredRootSchema) {
      return;
    }
    // Ajv keys a root by its `$id` without an empty trailing fragment, so it is removed under that key too
    const rootSchemaId = rootSchemaIdOf(rootSchema).replace(/#$/, '');
    // add the rootSchema ROOT_SCHEMA_PREFIX as id.
    // if schema validator instance doesn't exist, add it.
    // else if the root schemas don't match, we should remove and add the root schema so we don't have to remove and recompile the schema every run.
    try {
      if (this.ajv.getSchema(rootSchemaId) === undefined) {
        this.ajv.addSchema(rootSchema, rootSchemaId);
      } else if (!deepEquals(rootSchema, this.ajv.getSchema(rootSchemaId)?.schema)) {
        this.replaceRootSchema(rootSchema, rootSchemaId, true);
      }
    } catch {
      // A root this instance's dialect rejects, such as a 2020-12 root under the default draft-07 Ajv, is still
      // registered, unvalidated, so a `$ref` into its definitions resolves from the first call on. The old root is
      // dropped first because comparing against it compiles it, which throws for a rejected root.
      this.replaceRootSchema(rootSchema, rootSchemaId, false);
    }
    this.lastSeenRootSchema = rootSchema;
    this.hasRegisteredRootSchema = true;
  }

  /** Validates data against a schema, returning true if the data is valid, or
   * false otherwise. If the schema is invalid, then this function will return
   * false.
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
      this.handleSchemaUpdate(rootSchema);
      // A `$ref` local to the root, such as one in an option or a condition a form scores or picks a branch with,
      // names the root by the id it is registered under, whatever the schema holding it is registered as
      const schemaWithIdRefPrefix = withRootIdRefPrefix<S>(schema, rootSchema);
      schemaId = schemaKey(schemaWithIdRefPrefix);
      // Add schema by an explicit ID so it can be fetched later
      // Fall back to using compile if necessary
      // https://ajv.js.org/guide/managing-schemas.html#pre-adding-all-schemas-vs-adding-on-demand
      const registered = this.ajv.getSchema(schemaId);
      if (registered === undefined) {
        this.subschemaIds.add(schemaId);
      }
      const compiledValidator =
        registered ??
        this.ajv.addSchema(schemaWithIdRefPrefix, schemaId).getSchema(schemaId) ??
        this.ajv.compile(schemaWithIdRefPrefix);
      compiled = true;
      const result = compiledValidator(formData);
      return result;
    } catch (e) {
      // The schema is named so two schemas that fail with the same error text aren't deduped into one warning, and
      // `compiled` distinguishes a schema that wouldn't compile from one that did and then threw on the form data,
      // which would otherwise share a key whenever the two errors read alike
      const named = schemaId === undefined ? '' : ` "${schemaId}"`;
      logOnce(
        compiled
          ? `Error encountered validating form data against schema${named}:`
          : `Error encountered compiling schema${named}:`,
        'warn',
        e,
      );
      // Remove the broken schema from AJV's registry so a subsequent rawValidation
      // or isValid call does not silently reuse a cached entry that bypassed
      // meta-schema validation. Guard with !compiled so that a runtime error thrown
      // by compiledValidator(formData) does not evict a correctly-compiled schema.
      if (!compiled && schemaId !== undefined) {
        this.ajv.removeSchema(schemaId);
      }
      return false;
    }
  }
}
