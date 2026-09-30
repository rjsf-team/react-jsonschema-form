import { ENUM_OPTION_INDEX_PREFIX } from './constants.ts';
import type { EnumOptionsType, OptionValueFormat, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Whether `value` is encoded as its prefixed index whatever the other options are */
function alwaysEncodesAsIndex(value: unknown): boolean {
  return (
    typeof value === 'object' ||
    value === '' ||
    (typeof value === 'string' && value.startsWith(ENUM_OPTION_INDEX_PREFIX))
  );
}

const sharedStringsCache = new WeakMap<object, Set<string>>();

/** The `String()` forms that more than one option of `enumOptions` would be encoded as, memoized per list since every
 * option of a widget's list is encoded against it on each render
 *
 * @param enumOptions - The available enum options
 * @returns - The set of strings shared by two or more options
 */
function sharedStrings(enumOptions: readonly { value: unknown }[]): Set<string> {
  let shared = sharedStringsCache.get(enumOptions);
  if (!shared) {
    const seen = new Set<string>();
    shared = new Set<string>();
    for (const { value } of enumOptions) {
      // `undefined` is encoded as the empty string, so it shares nothing with a `'undefined'` option
      if (value !== undefined && !alwaysEncodesAsIndex(value)) {
        const encoded = String(value);
        if (seen.has(encoded)) {
          shared.add(encoded);
        } else {
          seen.add(encoded);
        }
      }
    }
    sharedStringsCache.set(enumOptions, shared);
  }
  return shared;
}

/** Whether `enumOptionValueEncoder()` encodes `value` as its option's prefixed index in the `realValue` format
 *
 * @param value - The typed enum value
 * @param enumOptions - The available enum options, which `value` is encoded against
 * @returns - True for an object, array or `null`, for the empty string or a string starting with
 *        `ENUM_OPTION_INDEX_PREFIX`, and for a value whose `String()` another option of `enumOptions` shares
 */
export function encodesAsIndex<S extends StrictRJSFSchema = RJSFSchema>(
  value: unknown,
  enumOptions: EnumOptionsType<S>[] | undefined,
): boolean {
  return alwaysEncodesAsIndex(value) || (Array.isArray(enumOptions) && sharedStrings(enumOptions).has(String(value)));
}

/** Encodes an enum option value into a string for a DOM value attribute.
 *
 * When `format` is `'realValue'`, primitive values are converted via `String()`.
 * Non-primitive values (objects, arrays) fall back to their index, prefixed with `ENUM_OPTION_INDEX_PREFIX`, since
 * `String()` would produce `"[object Object]"`. So do `null`, since `String()` would make it indistinguishable
 * from the string `'null'`, and the empty string, which is the value of a select's empty placeholder. The prefix keeps
 * that index from sharing a value with a primitive option spelled as the same number, and a string that itself starts
 * with the prefix is encoded as its index too, so it can't share a value with the option at the index it spells.
 * Options of `enumOptions` whose `String()` is the same, such as `1` and `'1'`, are each encoded as their index, so
 * every option keeps a DOM value of its own.
 *
 * When `format` is `'indexed'` (the default), returns the index as a string.
 *
 * @param value - The typed enum value
 * @param index - The option's position in the enumOptions array
 * @param enumOptions - The available enum options, which keep options that share a `String()` apart; the same list the
 *        widget decodes with
 * @param [format='indexed'] - How to encode the value for the DOM attribute
 * @returns The string to use as the DOM value attribute
 */
export default function enumOptionValueEncoder<S extends StrictRJSFSchema = RJSFSchema>(
  value: unknown,
  index: number,
  enumOptions: EnumOptionsType<S>[] | undefined,
  format: OptionValueFormat = 'indexed',
): string {
  if (format !== 'realValue') {
    return String(index);
  }
  if (value === undefined) {
    return '';
  }
  if (encodesAsIndex(value, enumOptions)) {
    return `${ENUM_OPTION_INDEX_PREFIX}${index}`;
  }
  return String(value);
}
