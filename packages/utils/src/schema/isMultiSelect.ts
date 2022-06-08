import { RJSFSchema, ValidatorType } from '../types';

import isSelect from './isSelect';

/** Checks to see if the `schema` combination represents a multi-select
 *
 * @param validator - An implementation of the `ValidatorType` interface that will be used when necessary
 * @param schema - The schema for which check for a multi-select flag is desired
 * @param [rootSchema] - The root schema, used to primarily to look up `$ref`s
 * @returns - True if schema contains a multi-select, otherwise false
 */
export default function isMultiSelect<T = any>(
  validator: ValidatorType, schema: RJSFSchema, rootSchema?: RJSFSchema
) {
  if (!schema.uniqueItems || !schema.items || typeof schema.items === 'boolean') {
    return false;
  }
  return isSelect<T>(validator, schema.items as RJSFSchema, rootSchema);
}
