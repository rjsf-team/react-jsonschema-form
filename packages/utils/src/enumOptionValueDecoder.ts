import { EnumOptionsType, StrictRJSFSchema, RJSFSchema } from './types';
import enumOptionsValueForIndex from './enumOptionsValueForIndex';

function decodeSingle<S extends StrictRJSFSchema = RJSFSchema>(
  value: string,
  enumOptions: EnumOptionsType<S>[] | undefined,
  emptyValue?: unknown,
): unknown {
  if (value === '') {
    return emptyValue;
  }
  if (!Array.isArray(enumOptions)) {
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
 * When `useRealValues` is true, does a reverse lookup: finds the enum option
 * whose String(value) matches the input string and returns the original typed value.
 * For object/array values that were encoded as indices, falls back to index resolution.
 *
 * When `useRealValues` is false, uses index-based resolution via enumOptionsValueForIndex
 * (current default behavior).
 *
 * @param value - The string value(s) from the DOM
 * @param enumOptions - The available enum options
 * @param useRealValues - Whether real values or indices were used for encoding
 * @param emptyValue - The value to return for empty/missing selections
 * @returns The original typed enum value(s)
 */
export default function enumOptionValueDecoder<S extends StrictRJSFSchema = RJSFSchema>(
  value: string | string[],
  enumOptions: EnumOptionsType<S>[] | undefined,
  useRealValues: boolean,
  emptyValue?: unknown,
): unknown {
  if (!useRealValues) {
    return enumOptionsValueForIndex<S>(value, enumOptions, emptyValue);
  }
  if (Array.isArray(value)) {
    return value.map((v) => decodeSingle(v, enumOptions, emptyValue));
  }
  return decodeSingle(value, enumOptions, emptyValue);
}
