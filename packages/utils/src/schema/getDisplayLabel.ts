import { UI_FIELD_NAME, UI_WIDGET_NAME } from '../constants';
import getSchemaType from '../getSchemaType';
import getUiOptions from '../getUiOptions';
import isCustomWidget from '../isCustomWidget';
import { RJSFSchema, UiSchema, ValidatorType } from '../types';
import isFilesArray from './isFilesArray';
import isMultiSelect from './isMultiSelect';

export default function getDisplayLabel<T = any, F = any>(
  validator: ValidatorType, schema: RJSFSchema, uiSchema: UiSchema<T, F>, rootSchema?: RJSFSchema
): boolean {
  const uiOptions = getUiOptions<T, F>(uiSchema);
  const { label = true } = uiOptions;
  let displayLabel = !!label;
  const schemaType = getSchemaType(schema);

  if (schemaType === 'array') {
    displayLabel =
      isMultiSelect<T>(validator, schema, rootSchema) ||
      isFilesArray<T, F>(validator, schema, uiSchema, rootSchema) ||
      isCustomWidget(uiSchema);
  }

  if (schemaType === 'object') {
    displayLabel = false;
  }
  if (schemaType === 'boolean' && !uiSchema[UI_WIDGET_NAME]) {
    displayLabel = false;
  }
  if (uiSchema[UI_FIELD_NAME]) {
    displayLabel = false;
  }
  return displayLabel;
}
