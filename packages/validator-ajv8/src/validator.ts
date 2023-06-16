import Ajv, { ErrorObject, ValidateFunction } from 'ajv';
import {
  CustomValidator,
  ErrorSchema,
  ErrorTransformer,
  FormContextType,
  ID_KEY,
  RJSFSchema,
  ROOT_SCHEMA_PREFIX,
  StrictRJSFSchema,
  toErrorList,
  UiSchema,
  ValidationData,
  ValidatorType,
  withIdRefPrefix,
  hashForSchema,
} from '@rjsf/utils';

import { CustomValidatorOptionsType, Localizer } from './types';
import createAjvInstance from './createAjvInstance';
import processRawValidationErrors, { RawValidationErrorsType } from './processRawValidationErrors';

/** `ValidatorType` implementation that uses the AJV 8 validation mechanism.
 */
export default class AJV8Validator<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>
  implements ValidatorType<T, S, F>
{
  /** The AJV instance to use for all validations
   *
   * @private
   */
  private ajv: Ajv;

  /** The Localizer function to use for localizing Ajv errors
   *
   * @private
   */
  readonly localizer?: Localizer;

  /** Constructs an `AJV8Validator` instance using the `options`
   *
   * @param options - The `CustomValidatorOptionsType` options that are used to create the AJV instance
   * @param [localizer] - If provided, is used to localize a list of Ajv `ErrorObject`s
   */
  constructor(options: CustomValidatorOptionsType, localizer?: Localizer) {
    const { additionalMetaSchemas, customFormats, ajvOptionsOverrides, ajvFormatOptions, AjvClass } = options;
    this.ajv = createAjvInstance(additionalMetaSchemas, customFormats, ajvOptionsOverrides, ajvFormatOptions, AjvClass);
    this.localizer = localizer;
  }

  /** Converts an `errorSchema` into a list of `RJSFValidationErrors`
   *
   * @param errorSchema - The `ErrorSchema` instance to convert
   * @param [fieldPath=[]] - The current field path, defaults to [] if not specified
   * @deprecated - Use the `toErrorList()` function provided by `@rjsf/utils` instead. This function will be removed in
   *        the next major release.
   */
  toErrorList(errorSchema?: ErrorSchema<T>, fieldPath: string[] = []) {
    return toErrorList(errorSchema, fieldPath);
  }

  /** Runs the pure validation of the `schema` and `formData` without any of the RJSF functionality. Provided for use
   * by the playground. Returns the `errors` from the validation
   *
   * @param schema - The schema against which to validate the form data   * @param schema
   * @param formData - The form data to validate
   */
  rawValidation<Result = any>(schema: S, formData?: T): RawValidationErrorsType<Result> {
    let compilationError: Error | undefined = undefined;
    let compiledValidator: ValidateFunction | undefined;
    if (schema[ID_KEY]) {
      compiledValidator = this.ajv.getSchema(schema[ID_KEY]);
    }
    try {
      if (compiledValidator === undefined) {
        compiledValidator = this.ajv.compile(schema);
      }
      compiledValidator(formData);
    } catch (err) {
      compilationError = err as Error;
    }

    let errors;
    if (compiledValidator) {
      if (typeof this.localizer === 'function') {
        this.localizer(compiledValidator.errors);
      }
      errors = compiledValidator.errors || undefined;

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
   */
  validateFormData(
    formData: T | undefined,
    schema: S,
    customValidate?: CustomValidator<T, S, F>,
    transformErrors?: ErrorTransformer<T, S, F>,
    uiSchema?: UiSchema<T, S, F>
  ): ValidationData<T> {
    const rawErrors = this.rawValidation<ErrorObject>(schema, formData);
    return processRawValidationErrors(this, rawErrors, formData, schema, customValidate, transformErrors, uiSchema);
  }

  /** Validates data against a schema, returning true if the data is valid, or
   * false otherwise. If the schema is invalid, then this function will return
   * false.
   *
   * @param schema - The schema against which to validate the form data
   * @param formData - The form data to validate
   * @param rootSchema - The root schema used to provide $ref resolutions
   */
  isValid(schema: S, formData: T | undefined, rootSchema: S) {
    const rootSchemaId = rootSchema[ID_KEY] ?? ROOT_SCHEMA_PREFIX;
    try {
      // add the rootSchema ROOT_SCHEMA_PREFIX as id.
      // then rewrite the schema ref's to point to the rootSchema
      // this accounts for the case where schema have references to models
      // that lives in the rootSchema but not in the schema in question.
      if (this.ajv.getSchema(rootSchemaId) === undefined) {
        this.ajv.addSchema(rootSchema, rootSchemaId);
      }
      const schemaWithIdRefPrefix = withIdRefPrefix<S>(schema) as S;
      const schemaId = schemaWithIdRefPrefix[ID_KEY] ?? hashForSchema(schemaWithIdRefPrefix);
      let compiledValidator: ValidateFunction | undefined;
      compiledValidator = this.ajv.getSchema(schemaId);
      if (compiledValidator === undefined) {
        // Add schema by an explicit ID so it can be fetched later
        // Fall back to using compile if necessary
        // https://ajv.js.org/guide/managing-schemas.html#pre-adding-all-schemas-vs-adding-on-demand
        compiledValidator =
          this.ajv.addSchema(schemaWithIdRefPrefix, schemaId).getSchema(schemaId) ||
          this.ajv.compile(schemaWithIdRefPrefix);
      }
      const result = compiledValidator(formData);
      return result as boolean;
    } catch (e) {
      console.warn('Error encountered compiling schema:', e);
      return false;
    } finally {
      // TODO: A function should be called if the root schema changes so we don't have to remove and recompile the schema every run.
      // make sure we remove the rootSchema from the global ajv instance
      this.ajv.removeSchema(rootSchemaId);
    }
  }
}
