import { Ajv, ErrorObject } from 'ajv';
import {
  createErrorHandler,
  CustomValidator,
  ErrorSchema,
  ErrorTransformer,
  FormContextType,
  getDefaultFormState,
  RJSFSchema,
  RJSFValidationError,
  ROOT_SCHEMA_PREFIX,
  StrictRJSFSchema,
  toErrorList,
  toErrorSchema,
  UiSchema,
  unwrapErrorHandler,
  ValidationData,
  validationDataMerge,
  ValidatorType,
  withIdRefPrefix,
} from '@rjsf/utils';

import { CustomValidatorOptionsType } from './types';
import createAjvInstance from './createAjvInstance';

/** `ValidatorType` implementation that uses the AJV 6 validation mechanism.
 *
 * @deprecated in favor of the `@rjsf/validator-ajv8
 */
export default class AJV6Validator<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>
  implements ValidatorType<T, S, F>
{
  /** The AJV instance to use for all validations
   *
   * @private
   */
  private ajv: Ajv;

  /** Constructs an `AJV6Validator` instance using the `options`
   *
   * @param options - The `CustomValidatorOptionsType` options that are used to create the AJV instance
   */
  constructor(options: CustomValidatorOptionsType) {
    const { additionalMetaSchemas, customFormats, ajvOptionsOverrides } = options;
    this.ajv = createAjvInstance(additionalMetaSchemas, customFormats, ajvOptionsOverrides);
  }

  /** Converts an `errorSchema` into a list of `RJSFValidationErrors`
   *
   * @param errorSchema - The `ErrorSchema` instance to convert
   * @param [fieldPath=[]] - The current field path, defaults to [] if not specified
   * @deprecated - Use the `toErrorList()` function provided by `@rjsf/utils` instead. This function will be removed in
   *        the next major release.
   */
  toErrorList(errorSchema?: ErrorSchema<T>, fieldPath: string[] = []) {
    return toErrorList<T>(errorSchema, fieldPath);
  }

  /** Transforming the error output from ajv to format used by @rjsf/utils.
   * At some point, components should be updated to support ajv.
   *
   * @param errors - The list of AJV errors to convert to `RJSFValidationErrors`
   * @private
   */
  private transformRJSFValidationErrors(errors: ErrorObject[] = []): RJSFValidationError[] {
    return errors.map((e: ErrorObject) => {
      const { dataPath, keyword, message, params, schemaPath } = e;
      const property = `${dataPath}`;

      // put data in expected format
      return {
        name: keyword,
        property,
        message,
        params, // specific to ajv
        stack: `${property} ${message}`.trim(),
        schemaPath,
      };
    });
  }

  /** Runs the pure validation of the `schema` and `formData` without any of the RJSF functionality. Provided for use
   * by the playground. Returns the `errors` from the validation
   *
   * @param schema - The schema against which to validate the form data   * @param schema
   * @param formData - The form data to validate
   */
  rawValidation<Result = any>(schema: RJSFSchema, formData?: T): { errors?: Result[]; validationError?: Error } {
    let validationError: Error | undefined = undefined;
    try {
      this.ajv.validate(schema, formData);
    } catch (err) {
      validationError = err as Error;
    }

    const errors = this.ajv.errors || undefined;

    // Clear errors to prevent persistent errors, see #1104
    this.ajv.errors = null;

    return { errors: errors as unknown as Result[], validationError };
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
    const rootSchema = schema;

    const rawErrors = this.rawValidation<ErrorObject>(schema, formData);
    const { validationError } = rawErrors;
    let errors = this.transformRJSFValidationErrors(rawErrors.errors);

    const noProperMetaSchema =
      validationError && validationError.message && validationError.message.includes('no schema with key or ref ');

    if (noProperMetaSchema) {
      errors = [...errors, { stack: validationError!.message }];
    }
    if (typeof transformErrors === 'function') {
      errors = transformErrors(errors, uiSchema);
    }

    let errorSchema = toErrorSchema<T>(errors);

    if (noProperMetaSchema) {
      errorSchema = {
        ...errorSchema,
        ...{
          $schema: {
            __errors: [validationError!.message],
          },
        },
      };
    }

    if (typeof customValidate !== 'function') {
      return { errors, errorSchema };
    }

    // Include form data with undefined values, which is required for custom validation.
    const newFormData = getDefaultFormState<T, S, F>(this, schema, formData, rootSchema, true) as T;

    const errorHandler = customValidate(newFormData, createErrorHandler<T>(newFormData), uiSchema);
    const userErrorSchema = unwrapErrorHandler<T>(errorHandler);
    return validationDataMerge<T>({ errors, errorSchema }, userErrorSchema);
  }

  /** Validates data against a schema, returning true if the data is valid, or
   * false otherwise. If the schema is invalid, then this function will return
   * false.
   *
   * @param schema - The schema against which to validate the form data   * @param schema
   * @param formData- - The form data to validate
   * @param rootSchema - The root schema used to provide $ref resolutions
   */
  isValid(schema: RJSFSchema, formData: T | undefined, rootSchema: RJSFSchema) {
    try {
      // add the rootSchema ROOT_SCHEMA_PREFIX as id.
      // then rewrite the schema ref's to point to the rootSchema
      // this accounts for the case where schema have references to models
      // that lives in the rootSchema but not in the schema in question.
      const result = this.ajv.addSchema(rootSchema, ROOT_SCHEMA_PREFIX).validate(withIdRefPrefix(schema), formData);
      return result as boolean;
    } catch (e) {
      return false;
    } finally {
      // make sure we remove the rootSchema from the global ajv instance
      this.ajv.removeSchema(ROOT_SCHEMA_PREFIX);
    }
  }
}
