import isNil from 'lodash/isNil';

/** Encodes an enum option value into a string for a DOM value attribute.
 *
 * When `useRealValues` is true, primitive values are converted via String().
 * Non-primitive values (objects, arrays) fall back to the index since
 * String() would produce "[object Object]".
 *
 * When `useRealValues` is false, returns the index as a string (current default behavior).
 *
 * @param value - The typed enum value
 * @param index - The option's position in the enumOptions array
 * @param useRealValues - Whether to use real values or indices
 * @returns The string to use as the DOM value attribute
 */
export default function enumOptionValueEncoder(value: unknown, index: number, useRealValues: boolean): string {
  if (!useRealValues) {
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
