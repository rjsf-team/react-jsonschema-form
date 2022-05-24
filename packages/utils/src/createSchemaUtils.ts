import { RJSFSchema, SchemaUtilsType, UiSchema, ValidatorType } from './types';
import {
  getDefaultFormState,
  getDisplayLabel,
  getMatchingOption,
  isFilesArray,
  isMultiSelect,
  isSelect,
  retrieveSchema,
  stubExistingAdditionalProperties,
  toIdSchema,
  toPathSchema,
} from './schema';

export class CreateSchemaUtils<T = any> implements SchemaUtilsType<T> {
  rootSchema: RJSFSchema;
  validator: ValidatorType;

  constructor(validator: ValidatorType, rootSchema: RJSFSchema) {
    this.rootSchema = rootSchema;
    this.validator = validator;
  }

  getDefaultFormState(schema: RJSFSchema, formData?: T, includeUndefinedValues = false): T | T[] | undefined {
    return getDefaultFormState<T>(this.validator, schema, formData, this.rootSchema, includeUndefinedValues);
  }

  getDisplayLabel<F = any>(schema: RJSFSchema, uiSchema: UiSchema<T, F>) {
    return getDisplayLabel<T, F>(this.validator, schema, uiSchema, this.rootSchema);
  }

  getMatchingOption(formData: T, options: RJSFSchema[]) {
    return getMatchingOption<T>(this.validator, formData, options, this.rootSchema);
  }

  isFilesArray<F = any>(schema: RJSFSchema, uiSchema: UiSchema<T, F>) {
    return isFilesArray<T, F>(this.validator, schema, uiSchema, this.rootSchema);
  }

  isMultiSelect(schema: RJSFSchema) {
    return isMultiSelect<T>(this.validator, schema, this.rootSchema);
  }

  isSelect(schema: RJSFSchema) {
    return isSelect<T>(this.validator, schema, this.rootSchema);
  }

  retrieveSchema(schema: RJSFSchema, rawFormData: T) {
    return retrieveSchema<T>(this.validator, schema, this.rootSchema, rawFormData);
  }

  stubExistingAdditionalProperties(schema: RJSFSchema, formData: T) {
    return stubExistingAdditionalProperties<T>(this.validator, schema, this.rootSchema, formData);
  }

  toIdSchema(schema: RJSFSchema, id: string, formData: T, idPrefix = 'root', idSeparator = '_') {
    return toIdSchema<T>(this.validator, schema, id, this.rootSchema, formData, idPrefix, idSeparator);
  }

  toPathSchema(schema: RJSFSchema, name: string, formData: T) {
    return toPathSchema<T>(this.validator, schema, name, this.rootSchema, formData);
  }
}

export default function createSchemaUtils<T = any>(
  validator: ValidatorType, rootSchema: RJSFSchema
): SchemaUtilsType<T> {
  return new CreateSchemaUtils<T>(validator, rootSchema);
}
