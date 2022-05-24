import { RJSFSchema, ValidatorType } from '../types';

import isSelect from './isSelect';

export default function isMultiSelect(validator: ValidatorType, schema: RJSFSchema, rootSchema: RJSFSchema = {}) {
  if (!schema.uniqueItems || !schema.items || typeof schema.items === 'boolean') {
    return false;
  }
  return isSelect(validator, schema.items as RJSFSchema, rootSchema);
}
