import Ajv, { ErrorObject, ValidateFunction } from 'ajv';
import get from 'lodash/get';
import {
  createErrorHandler,
  CustomValidator,
  ErrorSchema,
  ErrorTransformer,
  FormContextType,
  getDefaultFormState,
  getUiOptions,
  PROPERTIES_KEY,
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

import { CustomValidatorOptionsType, Localizer } from './types';
import createAjvInstance from './createAjvInstance';

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
   */
  toErrorList(errorSchema?: ErrorSchema<T>, fieldPath: string[] = []) {
    return toErrorList(errorSchema, fieldPath);
  }

  /** Transforming the error output from ajv to format used by @rjsf/utils.
   * At some point, components should be updated to support ajv.
   *
   * @param errors - The list of AJV errors to convert to `RJSFValidationErrors`
   * @param [uiSchema] - An optional uiSchema that is passed to `transformErrors` and `customValidate`
   * @protected
   */
  protected transformRJSFValidationErrors(
    errors: ErrorObject[] = [],
    uiSchema?: UiSchema<T, S, F>
  ): RJSFValidationError[] {
    return errors.map((e: ErrorObject) => {
      const { instancePath, keyword, params, schemaPath, parentSchema, ...rest } = e;
      let { message = '' } = rest;
      let property = instancePath.replace(/\//g, '.');
      let stack = `${property} ${message}`.trim();

      if ('missingProperty' in params) {
        property = property ? `${property}.${params.missingProperty}` : params.missingProperty;
        const currentProperty: string = params.missingProperty;
        const uiSchemaTitle = getUiOptions(get(uiSchema, `${property.replace(/^\./, '')}`)).title;

        if (uiSchemaTitle) {
          message = message.replace(currentProperty, uiSchemaTitle);
        } else {
          const parentSchemaTitle = get(parentSchema, [PROPERTIES_KEY, currentProperty, 'title']);

          if (parentSchemaTitle) {
            message = message.replace(currentProperty, parentSchemaTitle);
          }
        }

        stack = message;
      } else {
        const uiSchemaTitle = getUiOptions<T, S, F>(get(uiSchema, `${property.replace(/^\./, '')}`)).title;

        if (uiSchemaTitle) {
          stack = `'${uiSchemaTitle}' ${message}`.trim();
        } else {
          const parentSchemaTitle = parentSchema?.title;

          if (parentSchemaTitle) {
            stack = `'${parentSchemaTitle}' ${message}`.trim();
          }
        }
      }

      // put data in expected format
      return {
        name: keyword,
        property,
        message,
        params, // specific to ajv
        stack,
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
    let compilationError: Error | undefined = undefined;
    let compiledValidator: ValidateFunction | undefined;
    if (schema['$id']) {
      compiledValidator = this.ajv.getSchema(schema['$id']);
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
    const { validationError: invalidSchemaError } = rawErrors;
    let errors = this.transformRJSFValidationErrors(rawErrors.errors, uiSchema);

    if (invalidSchemaError) {
      errors = [...errors, { stack: invalidSchemaError!.message }];
    }
    if (typeof transformErrors === 'function') {
      errors = transformErrors(errors, uiSchema);
    }

    let errorSchema = toErrorSchema<T>(errors);

    if (invalidSchemaError) {
      errorSchema = {
        ...errorSchema,
        $schema: {
          __errors: [invalidSchemaError!.message],
        },
      };
    }

    if (typeof customValidate !== 'function') {
      return { errors, errorSchema };
    }

    // Include form data with undefined values, which is required for custom validation.
    const newFormData = getDefaultFormState<T, S, F>(this, schema, formData, schema, true) as T;

    const errorHandler = customValidate(newFormData, createErrorHandler<T>(newFormData), uiSchema);
    const userErrorSchema = unwrapErrorHandler<T>(errorHandler);
    return validationDataMerge<T>({ errors, errorSchema }, userErrorSchema);
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
    const rootSchemaId = rootSchema['$id'] ?? ROOT_SCHEMA_PREFIX;
    try {
      // add the rootSchema ROOT_SCHEMA_PREFIX as id.
      // then rewrite the schema ref's to point to the rootSchema
      // this accounts for the case where schema have references to models
      // that lives in the rootSchema but not in the schema in question.
      if (this.ajv.getSchema(rootSchemaId) === undefined) {
        this.ajv.addSchema(rootSchema, rootSchemaId);
      }
      const schemaWithIdRefPrefix = withIdRefPrefix<S>(schema) as S;
      let compiledValidator: ValidateFunction | undefined;
      if (schemaWithIdRefPrefix['$id']) {
        compiledValidator = this.ajv.getSchema(schemaWithIdRefPrefix['$id']);
      }
      if (compiledValidator === undefined) {
        compiledValidator = this.ajv.compile(schemaWithIdRefPrefix);
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
