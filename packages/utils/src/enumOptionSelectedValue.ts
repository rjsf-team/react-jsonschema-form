import { indexDomValue, realValueEncoder } from './enumOptionsDomValues.ts';
import enumOptionsIndexForValue from './enumOptionsIndexForValue.ts';
import type { EnumOptionsType, OptionValueFormat, StrictRJSFSchema, RJSFSchema } from './types.ts';

const NO_MATCH = Symbol('no match');

/** Computes the value to pass to a select element's `value` attribute.
 *
 * When `format` is `'realValue'`, encodes form data values as `enumOptionsDomValues()` encodes the options' values.
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
  value: unknown,
  enumOptions: EnumOptionsType<S>[] | undefined,
  multiple: boolean,
  format: OptionValueFormat = 'indexed',
  emptyValue?: unknown,
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
    const encodeValue = realValueEncoder<S>(enumOptions);
    const encode = (item: unknown, noMatch: unknown) => {
      const encoded = encodeValue(item);
      // Only a value encoded as its index needs the scan that searches for one
      if (encoded !== undefined) {
        return encoded;
      }
      const index = enumOptionsIndexForValue<S>(item, enumOptions);
      return index === undefined ? noMatch : indexDomValue(Number(index));
    };
    if (!multiple) {
      return encode(value, emptyValue);
    }
    // Form data for a multiple widget isn't guaranteed to be an array (e.g. `null` for a nullable array type), so a lone
    // value is matched as a one-item selection, as the `indexed` format does. An entry that is encoded as its index but
    // matches no option is left out, since any value standing in for it could be one an option encodes as
    return (Array.isArray(value) ? value : [value])
      .map((item) => encode(item, NO_MATCH))
      .filter((encoded) => encoded !== NO_MATCH);
  }

  const indexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  return typeof indexes === 'undefined' ? emptyValue : indexes;
}
