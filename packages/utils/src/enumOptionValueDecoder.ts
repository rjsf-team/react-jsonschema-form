import enumOptionsValueForIndex from './enumOptionsValueForIndex.ts';
import enumOptionValueEncoder from './enumOptionValueEncoder.ts';
import type { EnumOptionsType, OptionValueFormat, StrictRJSFSchema, RJSFSchema } from './types.ts';

/** Resolves a single DOM value string back to its typed enum value in `'realValue'` mode.
 *
 * Finds the option that `enumOptionValueEncoder()` encodes as the input, so every value round-trips, including the
 * object, array and `null` values that are encoded as their index.
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
  const match = enumOptions.find((opt, index) => enumOptionValueEncoder(opt.value, index, 'realValue') === value);
  return match ? match.value : emptyValue;
}

/** Decodes a string from a DOM value attribute back to a typed enum value.
 *
 * When `format` is `'realValue'`, does a reverse lookup: finds the enum option
 * that `enumOptionValueEncoder()` encodes as the input string and returns the original typed value.
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
