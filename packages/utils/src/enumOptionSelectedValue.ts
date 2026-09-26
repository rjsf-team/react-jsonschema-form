import enumOptionsIndexForValue from './enumOptionsIndexForValue.ts';
import enumOptionValueEncoder from './enumOptionValueEncoder.ts';
import type { EnumOptionsType, OptionValueFormat, StrictRJSFSchema, RJSFSchema } from './types.ts';

/** Computes the value to pass to a select element's `value` attribute.
 *
 * When `format` is `'realValue'`, encodes form data values with `enumOptionValueEncoder`, matching the options' values.
 * When `format` is `'indexed'` (the default), resolves to index-based values via
 * `enumOptionsIndexForValue`. Returns `emptyValue` when the current value is empty.
 *
 * @param value - The current form data value
 * @param enumOptions - The available enum options
 * @param multiple - Whether the select allows multiple selections
 * @param [format='indexed'] - How option values are encoded on the DOM
 * @param emptyValue - The value to return when the selection is empty
 * @returns The value to use for the select element's `value` attribute
 */
export default function enumOptionSelectedValue<S extends StrictRJSFSchema = RJSFSchema>(
  value: any,
  enumOptions: EnumOptionsType<S>[] | undefined,
  multiple: boolean,
  format: OptionValueFormat = 'indexed',
  emptyValue?: any,
): any {
  // A single value that equals `emptyValue` still counts as a selection when an option carries it, since widgets pick
  // sentinels like `null` or `''` that a `oneOf`/`anyOf` of constants can legitimately offer as an option of its own
  const isEmpty =
    typeof value === 'undefined' ||
    (multiple && Array.isArray(value) && value.length < 1) ||
    (!multiple && value === emptyValue && enumOptionsIndexForValue<S>(value, enumOptions) === undefined);

  if (isEmpty) {
    return emptyValue;
  }

  if (format === 'realValue') {
    // Encoded the same way as the options' values so they match, e.g. `null` is its option's index on both sides
    const encode = (item: any, noMatch: any) => {
      // Only an object or `null` is encoded as its index, so every other value skips the scan that searches for one
      if (typeof item !== 'object') {
        return enumOptionValueEncoder(item, 0, format);
      }
      const index = enumOptionsIndexForValue<S>(item, enumOptions);
      // A value with no matching option has no index to encode, which would otherwise render as the string `NaN`
      return index === undefined ? noMatch : enumOptionValueEncoder(item, Number(index), format);
    };
    if (!multiple) {
      return encode(value, emptyValue);
    }
    // Form data for a multiple widget isn't guaranteed to be an array (e.g. `null` for a nullable array type), so a lone
    // value is matched as a one-item selection, as the `indexed` format does. `emptyValue` describes the whole
    // selection, so an unmatched entry uses the empty string that `enumOptionValueEncoder()` gives a single empty option
    return (Array.isArray(value) ? value : [value]).map((item: any) => encode(item, ''));
  }

  const indexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  return typeof indexes === 'undefined' ? emptyValue : indexes;
}
