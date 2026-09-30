import enumOptionsDomValues from './enumOptionsDomValues.ts';
import enumOptionsValueForIndex from './enumOptionsValueForIndex.ts';
import type { EnumOptionsType, OptionValueFormat, StrictRJSFSchema, RJSFSchema } from './types.ts';

/** Decodes a string from a DOM value attribute back to a typed enum value.
 *
 * When `format` is `'realValue'`, does a reverse lookup: finds the enum option that `enumOptionsDomValues()` encodes
 * as the input string and returns the original typed value, including the object, array and `null` values and the
 * options sharing a `String()`, such as `1` and `'1'`, that are encoded as their prefixed index. A bare index is not an
 * option's position here, since it can't be told apart from a number option's own value; a widget holding a position
 * resolves it with `enumOptionsValueForIndex()` instead.
 *
 * When `format` is `'indexed'` (the default), uses index-based resolution via
 * `enumOptionsValueForIndex`.
 *
 * @param value - The string value(s) from the DOM
 * @param enumOptions - The available enum options
 * @param [format='indexed'] - How the values were encoded on the DOM
 * @param emptyValue - The value to return for empty/missing selections
 * @returns The original typed enum value(s)
 */
export default function enumOptionValueDecoder<S extends StrictRJSFSchema = RJSFSchema>(
  value: string | string[],
  enumOptions: EnumOptionsType<S>[] | undefined,
  format: OptionValueFormat = 'indexed',
  emptyValue?: unknown,
): unknown {
  if (format !== 'realValue') {
    return enumOptionsValueForIndex<S>(value, enumOptions, emptyValue);
  }
  const options = Array.isArray(enumOptions) ? enumOptions : [];
  const domValues = enumOptionsDomValues<S>(options, format);
  const optionByDomValue = new Map(options.map((option, index) => [domValues[index], option]));
  const decode = (item: string) => {
    // The empty string is a select's empty placeholder, although an `undefined` option is encoded as it too
    const option = item === '' ? undefined : optionByDomValue.get(item);
    return option ? option.value : emptyValue;
  };
  return Array.isArray(value) ? value.map(decode) : decode(value);
}
