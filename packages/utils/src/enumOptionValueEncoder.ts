import isNil from 'lodash/isNil';

import { OptionValueFormat } from './types';

/** Encodes an enum option value into a string for a DOM value attribute.
 *
 * When `format` is `'realValue'`, primitive values are converted via `String()`.
 * Non-primitive values (objects, arrays) fall back to the index since
 * `String()` would produce `"[object Object]"`.
 *
 * When `format` is `'indexed'` (the default), returns the index as a string.
 *
 * @param value - The typed enum value
 * @param index - The option's position in the enumOptions array
 * @param [format='indexed'] - How to encode the value for the DOM attribute
 * @returns The string to use as the DOM value attribute
 */
export default function enumOptionValueEncoder(
  value: unknown,
  index: number,
  format: OptionValueFormat = 'indexed',
): string {
  if (format !== 'realValue') {
    return String(index);
  }
  if (isNil(value)) {
    return '';
  }
  if (typeof value === 'object') {
    return String(index);
  }
  return String(value);
}
