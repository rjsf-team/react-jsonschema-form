import { RJSFSchema, ValidatorType } from '../types';

import isSelect from './isSelect';

export default function isMultiSelect<T = any>(
  validator: ValidatorType, schema: RJSFSchema, rootSchema: RJSFSchema = {}
) {
  if (!schema.uniqueItems || !schema.items || typeof schema.items === 'boolean') {
    return false;
  }
  return isSelect<T>(validator, schema.items as RJSFSchema, rootSchema);
}
