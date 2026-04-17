import { EnumOptionsType, OptionValueFormat, StrictRJSFSchema, RJSFSchema } from './types';
import enumOptionsValueForIndex from './enumOptionsValueForIndex';

/** Resolves a single DOM value string back to its typed enum value in `'realValue'` mode.
 *
 * First attempts a reverse lookup by matching `String(opt.value)` against the input.
 * If no option matches and the input parses as a valid index, falls back to the
 * option at that index — this is how object/array enum values round-trip, since
 * they are encoded as indices by the encoder.
 *
 * @param value - A single string value from a DOM attribute
 * @param enumOptions - The available enum options
 * @param emptyValue - The value to return when the input is empty, options are missing, or no match is found
 * @returns The original typed enum value, or `emptyValue`
 */
function decodeSingle<S extends StrictRJSFSchema = RJSFSchema>(
  value: string,
  enumOptions: EnumOptionsType<S>[] | undefined,
  emptyValue?: unknown,
): unknown {
  if (value === '' || !Array.isArray(enumOptions)) {
    return emptyValue;
  }
  const match = enumOptions.find((opt) => String(opt.value) === value);
  if (match) {
    return match.value;
  }
  // Fallback: value might be an index (for object/array enum values)
  const index = Number(value);
  if (!isNaN(index) && index >= 0 && index < enumOptions.length) {
    return enumOptions[index].value;
  }
  return emptyValue;
}

/** Decodes a string from a DOM value attribute back to a typed enum value.
 *
 * When `format` is `'realValue'`, does a reverse lookup: finds the enum option
 * whose `String(value)` matches the input string and returns the original typed value.
 * For object/array values that were encoded as indices, falls back to index resolution.
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
  if (Array.isArray(value)) {
    return value.map((v) => decodeSingle(v, enumOptions, emptyValue));
  }
  return decodeSingle(value, enumOptions, emptyValue);
}
