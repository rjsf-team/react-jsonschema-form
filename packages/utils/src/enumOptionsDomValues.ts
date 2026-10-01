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

/** The DOM value of an option that is encoded as its prefixed index, whose position in `enumOptions` is `index` */
export function indexDomValue(index: number): string {
  return `${ENUM_OPTION_INDEX_PREFIX}${index}`;
}

/** Returns the `realValue` encoding of values against `enumOptions`. The `String()` forms that more than one option
 * shares are found once here, so a caller encoding every option of a list stays linear in its length.
 *
 * @param enumOptions - The available enum options, which keep options that share a `String()` apart
 * @returns - A function from a value to its DOM value attribute, or to `undefined` when the value is encoded as its
 *        option's prefixed index instead
 */
export function realValueEncoder<S extends StrictRJSFSchema = RJSFSchema>(
  enumOptions: EnumOptionsType<S>[] | undefined,
): (value: unknown) => string | undefined {
  const seen = new Set<string>();
  const shared = new Set<string>();
  for (const { value } of Array.isArray(enumOptions) ? enumOptions : []) {
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
  return (value) => {
    if (value === undefined) {
      return '';
    }
    if (alwaysEncodesAsIndex(value) || shared.has(String(value))) {
      return undefined;
    }
    return String(value);
  };
}

/** Encodes every option of `enumOptions` for its DOM value attribute, in a single pass over the list. A widget reads an
 * option's value at its position, and `enumOptionValueDecoder()` and `enumOptionSelectedValue()` encode against the
 * same list, so they agree with it.
 *
 * When `format` is `'indexed'` (the default), each option's value is its index as a string.
 *
 * When `format` is `'realValue'`, primitive values are converted via `String()`.
 * Non-primitive values (objects, arrays) fall back to their index, prefixed with `ENUM_OPTION_INDEX_PREFIX`, since
 * `String()` would produce `"[object Object]"`. So do `null`, since `String()` would make it indistinguishable
 * from the string `'null'`, and the empty string, which is the value of a select's empty placeholder. The prefix keeps
 * that index from sharing a value with a primitive option spelled as the same number, and a string that itself starts
 * with the prefix is encoded as its index too, so it can't share a value with the option at the index it spells.
 * Options whose `String()` is the same, such as `1` and `'1'`, are each encoded as their index, so every option keeps a
 * DOM value of its own. That includes options with the very same value, such as two `'US'` constants titled `USA` and
 * `United States`, since options sharing a DOM value can't be told apart by any select, whether for picking one or
 * showing which is selected; both still decode to the value they share, so a multiple widget that takes its selection
 * from `enumOptionSelectedValue()` shows only the first of them as selected. An `undefined` option is encoded as the
 * empty string.
 *
 * @param enumOptions - The available enum options
 * @param [format='indexed'] - How to encode the values for the DOM attribute
 * @returns - The DOM value attribute of each option, in the order of `enumOptions`
 */
export default function enumOptionsDomValues<S extends StrictRJSFSchema = RJSFSchema>(
  enumOptions: EnumOptionsType<S>[] | undefined,
  format: OptionValueFormat = 'indexed',
): string[] {
  if (!Array.isArray(enumOptions)) {
    return [];
  }
  if (format !== 'realValue') {
    return enumOptions.map((_, index) => String(index));
  }
  const encode = realValueEncoder<S>(enumOptions);
  return enumOptions.map(({ value }, index) => encode(value) ?? indexDomValue(index));
}
