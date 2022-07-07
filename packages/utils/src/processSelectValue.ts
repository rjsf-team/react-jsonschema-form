import get from 'lodash/get';

import { RJSFSchema } from './types';
import asNumber from './asNumber';
import guessType from './guessType';

const nums = new Set<any>(['number', 'integer']);

/** Returns the real value for a select widget due to a silly limitation in the DOM which causes option change event
 * values to always be retrieved as strings.
 *
 * @param schema - The schema to used to determine the value's true type
 * @param [value] - The value to convert
 */
export default function processSelectValue(schema: RJSFSchema, value?: any) {
  const { enum: schemaEnum, type, items } = schema;
  if (value === '') {
    return undefined;
  }
  if (type === 'array' && items && nums.has(get(items, 'type'))) {
    return value.map(asNumber);
  }
  if (type === 'boolean') {
    return value === 'true';
  }
  if (nums.has(type)) {
    return asNumber(value);
  }

  // If type is undefined, but an enum is present, try and infer the type from
  // the enum values
  if (Array.isArray(schemaEnum)) {
    if (schemaEnum.every((x: any) => guessType(x) === 'number')) {
      return asNumber(value);
    }
    if (schemaEnum.every((x: any) => guessType(x) === 'boolean')) {
      return value === 'true';
    }
  }

  return value;
}
