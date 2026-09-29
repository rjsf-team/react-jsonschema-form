import { ENUM_OPTION_INDEX_PREFIX } from './constants.ts';
import type { OptionValueFormat } from './types.ts';

/** Whether `enumOptionValueEncoder()` encodes `value` as its option's prefixed index in the `realValue` format
 *
 * @param value - The typed enum value
 * @returns - True for an object, array or `null`, and for the empty string or a string starting with
 *        `ENUM_OPTION_INDEX_PREFIX`
 */
export function encodesAsIndex(value: unknown): boolean {
  return (
    typeof value === 'object' ||
    value === '' ||
    (typeof value === 'string' && value.startsWith(ENUM_OPTION_INDEX_PREFIX))
  );
}

/** Encodes an enum option value into a string for a DOM value attribute.
 *
 * When `format` is `'realValue'`, primitive values are converted via `String()`.
 * Non-primitive values (objects, arrays) fall back to their index, prefixed with `ENUM_OPTION_INDEX_PREFIX`, since
 * `String()` would produce `"[object Object]"`. So do `null`, since `String()` would make it indistinguishable
 * from the string `'null'`, and the empty string, which is the value of a select's empty placeholder. The prefix keeps
 * that index from sharing a value with a primitive option spelled as the same number, and a string that itself starts
 * with the prefix is encoded as its index too, so it can't share a value with the option at the index it spells.
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
  if (value === undefined) {
    return '';
  }
  if (encodesAsIndex(value)) {
    return `${ENUM_OPTION_INDEX_PREFIX}${index}`;
  }
  return String(value);
}
