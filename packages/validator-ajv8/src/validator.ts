import Ajv, { ErrorObject, ValidateFunction } from "ajv8";
import toPath from "lodash/toPath";
import isObject from "lodash/isObject";
import clone from "lodash/clone";
import {
  CustomValidator,
  ERRORS_KEY,
  ErrorSchema,
  ErrorSchemaBuilder,
  ErrorTransformer,
  FieldValidation,
  FormValidation,
  GenericObjectType,
  getDefaultFormState,
  mergeValidationData,
  REF_KEY,
  RJSFSchema,
  RJSFValidationError,
  StrictRJSFSchema,
  ValidationData,
  ValidatorType,
} from "@rjsf/utils";

import { CustomValidatorOptionsType, Localizer } from "./types";
import createAjvInstance from "./createAjvInstance";

const ROOT_SCHEMA_PREFIX = "__rjsf_rootSchema";

/** `ValidatorType` implementation that uses the AJV 8 validation mechanism.
 */
export default class AJV8Validator<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema
> implements ValidatorType<T>
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
    const {
      additionalMetaSchemas,
      customFormats,
      ajvOptionsOverrides,
      ajvFormatOptions,
      AjvClass,
    } = options;
    this.ajv = createAjvInstance(
      additionalMetaSchemas,
      customFormats,
      ajvOptionsOverrides,
      ajvFormatOptions,
      AjvClass
    );
    this.localizer = localizer;
  }

  /** Transforms a ajv validation errors list:
   * [
   *   {property: '.level1.level2[2].level3', message: 'err a'},
   *   {property: '.level1.level2[2].level3', message: 'err b'},
   *   {property: '.level1.level2[4].level3', message: 'err b'},
   * ]
   * Into an error tree:
   * {
   *   level1: {
   *     level2: {
   *       2: {level3: {errors: ['err a', 'err b']}},
   *       4: {level3: {errors: ['err b']}},
   *     }
   *   }
   * };
   *
   * @param errors - The list of RJSFValidationError objects
   * @private
   */
  private toErrorSchema(errors: RJSFValidationError[]): ErrorSchema<T> {
    const builder = new ErrorSchemaBuilder<T>();
    if (errors.length) {
      errors.forEach((error) => {
        const { property, message } = error;
        const path = toPath(property);

        // If the property is at the root (.level1) then toPath creates
        // an empty array element at the first index. Remove it.
        if (path.length > 0 && path[0] === "") {
          path.splice(0, 1);
        }
        if (message) {
          builder.addErrors(message, path);
        }
      });
    }
    return builder.ErrorSchema;
  }

  /** Converts an `errorSchema` into a list of `RJSFValidationErrors`
   *
   * @param errorSchema - The `ErrorSchema` instance to convert
   * @param [fieldPath=[]] - The current field path, defaults to [] if not specified
   */
  toErrorList(errorSchema?: ErrorSchema<T>, fieldPath: string[] = []) {
    if (!errorSchema) {
      return [];
    }
    let errorList: RJSFValidationError[] = [];
    if (ERRORS_KEY in errorSchema) {
      errorList = errorList.concat(
        errorSchema[ERRORS_KEY]!.map((message: string) => {
          const property = `.${fieldPath.join(".")}`;
          return {
            property,
            message,
            stack: `${property} ${message}`,
          };
        })
      );
    }
    return Object.keys(errorSchema).reduce((acc, key) => {
      if (key !== ERRORS_KEY) {
        acc = acc.concat(
          this.toErrorList((errorSchema as GenericObjectType)[key], [
            ...fieldPath,
            key,
          ])
        );
      }
      return acc;
    }, errorList);
  }

  /** Given a `formData` object, recursively creates a `FormValidation` error handling structure around it
   *
   * @param formData - The form data around which the error handler is created
   * @private
   */
  private createErrorHandler(formData: T): FormValidation<T> {
    const handler: FieldValidation = {
      // We store the list of errors for this node in a property named __errors
      // to avoid name collision with a possible sub schema field named
      // 'errors' (see `utils.toErrorSchema`).
      __errors: [],
      addError(message: string) {
        this.__errors!.push(message);
      },
    };
    if (Array.isArray(formData)) {
      return formData.reduce((acc, value, key) => {
        return { ...acc, [key]: this.createErrorHandler(value) };
      }, handler);
    }
    if (isObject(formData)) {
      const formObject: GenericObjectType = formData as GenericObjectType;
      return Object.keys(formObject).reduce((acc, key) => {
        return { ...acc, [key]: this.createErrorHandler(formObject[key]) };
      }, handler as FormValidation<T>);
    }
    return handler as FormValidation<T>;
  }

  /** Unwraps the `errorHandler` structure into the associated `ErrorSchema`, stripping the `addError` functions from it
   *
   * @param errorHandler - The `FormValidation` error handling structure
   * @private
   */
  private unwrapErrorHandler(errorHandler: FormValidation<T>): ErrorSchema<T> {
    return Object.keys(errorHandler).reduce((acc, key) => {
      if (key === "addError") {
        return acc;
      } else if (key === ERRORS_KEY) {
        return { ...acc, [key]: (errorHandler as GenericObjectType)[key] };
      }
      return {
        ...acc,
        [key]: this.unwrapErrorHandler(
          (errorHandler as GenericObjectType)[key]
        ),
      };
    }, {} as ErrorSchema<T>);
  }

  /** Transforming the error output from ajv to format used by @rjsf/utils.
   * At some point, components should be updated to support ajv.
   *
   * @param errors - The list of AJV errors to convert to `RJSFValidationErrors`
   * @private
   */
  private transformRJSFValidationErrors(
    errors: ErrorObject[] = []
  ): RJSFValidationError[] {
    return errors.map((e: ErrorObject) => {
      const { instancePath, keyword, message, params, schemaPath } = e;
      let property = instancePath.replace(/\//g, ".");
      let stack = `${property} ${message}`.trim();
      if ("missingProperty" in params) {
        property = property
          ? `${property}.${params.missingProperty}`
          : params.missingProperty;
        stack = message!;
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
  rawValidation<Result = any>(
    schema: RJSFSchema,
    formData?: T
  ): { errors?: Result[]; validationError?: Error } {
    let compilationError: Error | undefined = undefined;
    let compiledValidator: ValidateFunction | undefined;
    if (schema["$id"]) {
      compiledValidator = this.ajv.getSchema(schema["$id"]);
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
      if (typeof this.localizer === "function") {
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
   */
  validateFormData(
    formData: T | undefined,
    schema: S,
    customValidate?: CustomValidator<T>,
    transformErrors?: ErrorTransformer
  ): ValidationData<T> {
    const rawErrors = this.rawValidation<ErrorObject>(schema, formData);
    const { validationError: invalidSchemaError } = rawErrors;
    let errors = this.transformRJSFValidationErrors(rawErrors.errors);

    if (invalidSchemaError) {
      errors = [...errors, { stack: invalidSchemaError!.message }];
    }
    if (typeof transformErrors === "function") {
      errors = transformErrors(errors);
    }

    let errorSchema = this.toErrorSchema(errors);

    if (invalidSchemaError) {
      errorSchema = {
        ...errorSchema,
        $schema: {
          __errors: [invalidSchemaError!.message],
        },
      };
    }

    if (typeof customValidate !== "function") {
      return { errors, errorSchema };
    }

    // Include form data with undefined values, which is required for custom validation.
    const newFormData = getDefaultFormState<T>(
      this,
      schema,
      formData,
      schema,
      true
    ) as T;

    const errorHandler = customValidate(
      newFormData,
      this.createErrorHandler(newFormData)
    );
    const userErrorSchema = this.unwrapErrorHandler(errorHandler);
    return mergeValidationData<T>(
      this,
      { errors, errorSchema },
      userErrorSchema
    );
  }

  /** Takes a `node` object and transforms any contained `$ref` node variables with a prefix, recursively calling
   * `withIdRefPrefix` for any other elements.
   *
   * @param node - The object node to which a ROOT_SCHEMA_PREFIX is added when a REF_KEY is part of it
   * @private
   */
  private withIdRefPrefixObject(node: S) {
    for (const key in node) {
      const realObj: GenericObjectType = node;
      const value = realObj[key];
      if (
        key === REF_KEY &&
        typeof value === "string" &&
        value.startsWith("#")
      ) {
        realObj[key] = ROOT_SCHEMA_PREFIX + value;
      } else {
        realObj[key] = this.withIdRefPrefix(value);
      }
    }
    return node;
  }

  /** Takes a `node` object list and transforms any contained `$ref` node variables with a prefix, recursively calling
   * `withIdRefPrefix` for any other elements.
   *
   * @param node - The list of object nodes to which a ROOT_SCHEMA_PREFIX is added when a REF_KEY is part of it
   * @private
   */
  private withIdRefPrefixArray(node: S[]): S[] {
    for (let i = 0; i < node.length; i++) {
      node[i] = this.withIdRefPrefix(node[i]) as S;
    }
    return node;
  }

  /** Validates data against a schema, returning true if the data is valid, or
   * false otherwise. If the schema is invalid, then this function will return
   * false.
   *
   * @param schema - The schema against which to validate the form data
   * @param formData - The form data to validate
   * @param rootSchema - The root schema used to provide $ref resolutions
   */
  isValid(schema: S, formData: T, rootSchema: S) {
    const rootSchemaId = rootSchema["$id"] ?? ROOT_SCHEMA_PREFIX;
    try {
      // add the rootSchema ROOT_SCHEMA_PREFIX as id.
      // then rewrite the schema ref's to point to the rootSchema
      // this accounts for the case where schema have references to models
      // that lives in the rootSchema but not in the schema in question.
      if (this.ajv.getSchema(rootSchemaId) === undefined) {
        this.ajv.addSchema(rootSchema, rootSchemaId);
      }
      const schemaWithIdRefPrefix = this.withIdRefPrefix(schema) as S;
      let compiledValidator: ValidateFunction | undefined;
      if (schemaWithIdRefPrefix["$id"]) {
        compiledValidator = this.ajv.getSchema(schemaWithIdRefPrefix["$id"]);
      }
      if (compiledValidator === undefined) {
        compiledValidator = this.ajv.compile(schemaWithIdRefPrefix);
      }
      const result = compiledValidator(formData);
      return result as boolean;
    } catch (e) {
      console.warn("Error encountered compiling schema:", e);
      return false;
    } finally {
      // TODO: A function should be called if the root schema changes so we don't have to remove and recompile the schema every run.
      // make sure we remove the rootSchema from the global ajv instance
      this.ajv.removeSchema(rootSchemaId);
    }
  }

  /** Recursively prefixes all $ref's in a schema with `ROOT_SCHEMA_PREFIX`
   * This is used in isValid to make references to the rootSchema
   *
   * @param schemaNode - The object node to which a ROOT_SCHEMA_PREFIX is added when a REF_KEY is part of it
   * @protected
   */
  protected withIdRefPrefix(schemaNode: S | S[]): S | S[] {
    if (Array.isArray(schemaNode)) {
      return this.withIdRefPrefixArray([...schemaNode]);
    }
    if (isObject(schemaNode)) {
      return this.withIdRefPrefixObject(clone<S>(schemaNode));
    }
    return schemaNode;
  }
}
