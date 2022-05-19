import { JSONSchema7 } from 'json-schema';

import { UI_WIDGET_NAME } from '../constants';
import { UiSchema } from '../types';

export default function isFilesArray(schema: JSONSchema7, uiSchema: UiSchema, rootSchema: JSONSchema7 = {}) {
  if (uiSchema[UI_WIDGET_NAME] === 'files') {
    return true;
  } else if (schema.items) {
    const itemsSchema = retrieveSchema(schema.items, rootSchema);
    return itemsSchema.type === 'string' && itemsSchema.format === 'data-url';
  }
  return false;
}
