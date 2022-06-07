import { UI_WIDGET_NAME } from '../constants';
import { RJSFSchema, UiSchema, ValidatorType } from '../types';
import retrieveSchema from './retrieveSchema';

export default function isFilesArray<T = any, F = any>(
  validator: ValidatorType, schema: RJSFSchema, uiSchema: UiSchema<T, F>, rootSchema?: RJSFSchema
) {
  if (uiSchema[UI_WIDGET_NAME] === 'files') {
    return true;
  }
  if (schema.items) {
    const itemsSchema = retrieveSchema<T>(validator, schema.items as RJSFSchema, rootSchema);
    return itemsSchema.type === 'string' && itemsSchema.format === 'data-url';
  }
  return false;
}
