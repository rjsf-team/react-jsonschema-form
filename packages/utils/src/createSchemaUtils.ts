import deepEquals from "./deepEquals";
import {
  ErrorSchema,
  IdSchema,
  PathSchema,
  RJSFSchema,
  SchemaUtilsType,
  UiSchema,
  ValidationData,
  ValidatorType,
} from "./types";
import {
  getDefaultFormState,
  getDisplayLabel,
  getMatchingOption,
  isFilesArray,
  isMultiSelect,
  isSelect,
  mergeValidationData,
  retrieveSchema,
  toIdSchema,
  toPathSchema,
} from "./schema";

/** The `SchemaUtils` class provides a wrapper around the publicly exported APIs in the `utils/schema` directory such
 * that one does not have to explicitly pass the `validator` or `rootSchema` to each method. Since both the `validator`
 * and `rootSchema` generally does not change across a `Form`, this allows for providing a simplified set of APIs to the
 * `@rjsf/core` components and the various themes as well. This class implements the `SchemaUtilsType` interface.
 */
class SchemaUtils<T = any> implements SchemaUtilsType<T> {
  rootSchema: RJSFSchema;
  validator: ValidatorType;

  /** Constructs the `SchemaUtils` instance with the given `validator` and `rootSchema` stored as instance variables
   *
   * @param validator - An implementation of the `ValidatorType` interface that will be forwarded to all the APIs
   * @param rootSchema - The root schema that will be forwarded to all the APIs
   */
  constructor(validator: ValidatorType, rootSchema: RJSFSchema) {
    this.rootSchema = rootSchema;
    this.validator = validator;
  }

  /** Returns the `ValidatorType` in the `SchemaUtilsType`
   *
   * @returns - The `ValidatorType`
   */
  getValidator() {
    return this.validator;
  }

  /** Determines whether either the `validator` and `rootSchema` differ from the ones associated with this instance of
   * the `SchemaUtilsType`. If either `validator` or `rootSchema` are falsy, then return false to prevent the creation
   * of a new `SchemaUtilsType` with incomplete properties.
   *
   * @param validator - An implementation of the `ValidatorType` interface that will be compared against the current one
   * @param rootSchema - The root schema that will be compared against the current one
   * @returns - True if the `SchemaUtilsType` differs from the given `validator` or `rootSchema`
   */
  doesSchemaUtilsDiffer(
    validator: ValidatorType,
    rootSchema: RJSFSchema
  ): boolean {
    if (!validator || !rootSchema) {
      return false;
    }
    return (
      this.validator !== validator || !deepEquals(this.rootSchema, rootSchema)
    );
  }

  /** Returns the superset of `formData` that includes the given set updated to include any missing fields that have
   * computed to have defaults provided in the `schema`.
   *
   * @param schema - The schema for which the default state is desired
   * @param [formData] - The current formData, if any, onto which to provide any missing defaults
   * @param [includeUndefinedValues=false] - Optional flag, if true, cause undefined values to be added as defaults
   * @returns - The resulting `formData` with all the defaults provided
   */
  getDefaultFormState(
    schema: RJSFSchema,
    formData?: T,
    includeUndefinedValues = false
  ): T | T[] | undefined {
    return getDefaultFormState<T>(
      this.validator,
      schema,
      formData,
      this.rootSchema,
      includeUndefinedValues
    );
  }

  /** Determines whether the combination of `schema` and `uiSchema` properties indicates that the label for the `schema`
   * should be displayed in a UI.
   *
   * @param schema - The schema for which the display label flag is desired
   * @param [uiSchema] - The UI schema from which to derive potentially displayable information
   * @returns - True if the label should be displayed or false if it should not
   */
  getDisplayLabel<F = any>(schema: RJSFSchema, uiSchema?: UiSchema<T, F>) {
    return getDisplayLabel<T, F>(
      this.validator,
      schema,
      uiSchema,
      this.rootSchema
    );
  }

  /** Given the `formData` and list of `options`, attempts to find the index of the option that best matches the data.
   *
   * @param formData - The current formData, if any, onto which to provide any missing defaults
   * @param options - The list of options to find a matching options from
   * @returns - The index of the matched option or 0 if none is available
   */
  getMatchingOption(formData: T, options: RJSFSchema[]) {
    return getMatchingOption<T>(
      this.validator,
      formData,
      options,
      this.rootSchema
    );
  }

  /** Checks to see if the `schema` and `uiSchema` combination represents an array of files
   *
   * @param schema - The schema for which check for array of files flag is desired
   * @param [uiSchema] - The UI schema from which to check the widget
   * @returns - True if schema/uiSchema contains an array of files, otherwise false
   */
  isFilesArray<F = any>(schema: RJSFSchema, uiSchema?: UiSchema<T, F>) {
    return isFilesArray<T, F>(
      this.validator,
      schema,
      uiSchema,
      this.rootSchema
    );
  }

  /** Checks to see if the `schema` combination represents a multi-select
   *
   * @param schema - The schema for which check for a multi-select flag is desired
   * @returns - True if schema contains a multi-select, otherwise false
   */
  isMultiSelect(schema: RJSFSchema) {
    return isMultiSelect<T>(this.validator, schema, this.rootSchema);
  }

  /** Checks to see if the `schema` combination represents a select
   *
   * @param schema - The schema for which check for a select flag is desired
   * @returns - True if schema contains a select, otherwise false
   */
  isSelect(schema: RJSFSchema) {
    return isSelect<T>(this.validator, schema, this.rootSchema);
  }

  /** Merges the errors in `additionalErrorSchema` into the existing `validationData` by combining the hierarchies in
   * the two `ErrorSchema`s and then appending the error list from the `additionalErrorSchema` obtained by calling
   * `getValidator().toErrorList()` onto the `errors` in the `validationData`. If no `additionalErrorSchema` is passed,
   * then `validationData` is returned.
   *
   * @param validationData - The current `ValidationData` into which to merge the additional errors
   * @param [additionalErrorSchema] - The additional set of errors
   * @returns - The `validationData` with the additional errors from `additionalErrorSchema` merged into it, if provided.
   */
  mergeValidationData(
    validationData: ValidationData<T>,
    additionalErrorSchema?: ErrorSchema<T>
  ): ValidationData<T> {
    return mergeValidationData<T>(
      this.validator,
      validationData,
      additionalErrorSchema
    );
  }

  /** Retrieves an expanded schema that has had all of its conditions, additional properties, references and
   * dependencies resolved and merged into the `schema` given a `rawFormData` that is used to do the potentially
   * recursive resolution.
   *
   * @param schema - The schema for which retrieving a schema is desired
   * @param [rawFormData] - The current formData, if any, to assist retrieving a schema
   * @returns - The schema having its conditions, additional properties, references and dependencies resolved
   */
  retrieveSchema(schema: RJSFSchema, rawFormData: T) {
    return retrieveSchema<T>(
      this.validator,
      schema,
      this.rootSchema,
      rawFormData
    );
  }

  /** Generates an `IdSchema` object for the `schema`, recursively
   *
   * @param schema - The schema for which the display label flag is desired
   * @param [id] - The base id for the schema
   * @param [formData] - The current formData, if any, onto which to provide any missing defaults
   * @param [idPrefix='root'] - The prefix to use for the id
   * @param [idSeparator='_'] - The separator to use for the path segments in the id
   * @returns - The `IdSchema` object for the `schema`
   */
  toIdSchema(
    schema: RJSFSchema,
    id?: string | null,
    formData?: T,
    idPrefix = "root",
    idSeparator = "_"
  ): IdSchema<T> {
    return toIdSchema<T>(
      this.validator,
      schema,
      id,
      this.rootSchema,
      formData,
      idPrefix,
      idSeparator
    );
  }

  /** Generates an `PathSchema` object for the `schema`, recursively
   *
   * @param schema - The schema for which the display label flag is desired
   * @param [name] - The base name for the schema
   * @param [formData] - The current formData, if any, onto which to provide any missing defaults
   * @returns - The `PathSchema` object for the `schema`
   */
  toPathSchema(schema: RJSFSchema, name?: string, formData?: T): PathSchema<T> {
    return toPathSchema<T>(
      this.validator,
      schema,
      name,
      this.rootSchema,
      formData
    );
  }
}

/** Creates a `SchemaUtilsType` interface that is based around the given `validator` and `rootSchema` parameters. The
 * resulting interface implementation will forward the `validator` and `rootSchema` to all the wrapped APIs.
 *
 * @param validator - an implementation of the `ValidatorType` interface that will be forwarded to all the APIs
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @returns - An implementation of a `SchemaUtilsType` interface
 */
export default function createSchemaUtils<T = any>(
  validator: ValidatorType,
  rootSchema: RJSFSchema
): SchemaUtilsType<T> {
  return new SchemaUtils<T>(validator, rootSchema);
}
