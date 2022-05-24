import { UI_WIDGET_NAME } from '../constants';
import { RJSFSchema, UiSchema, ValidatorType } from '../types';
import { retrieveSchema } from './retrieveSchema';

export default function isFilesArray(
  validator: ValidatorType, schema: RJSFSchema, uiSchema: UiSchema, rootSchema: RJSFSchema = {}
) {
  if (uiSchema[UI_WIDGET_NAME] === 'files') {
    return true;
  }
  if (Array.isArray(schema.items)) {
    const itemsSchema = retrieveSchema(validator, schema.items as RJSFSchema, rootSchema);
    return itemsSchema.type === 'string' && itemsSchema.format === 'data-url';
  }
  return false;
}
