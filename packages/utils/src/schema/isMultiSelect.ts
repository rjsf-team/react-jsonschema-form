import { JSONSchema7 } from 'json-schema';

import isSelect from './isSelect';

export default function isMultiSelect(schema: JSONSchema7, rootSchema: JSONSchema7 = {}) {
  if (!schema.uniqueItems || !schema.items || typeof schema.items === 'boolean') {
    return false;
  }
  return isSelect(schema.items, rootSchema);
}
