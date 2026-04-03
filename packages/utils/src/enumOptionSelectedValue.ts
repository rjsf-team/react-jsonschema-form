import { EnumOptionsType, StrictRJSFSchema, RJSFSchema } from './types';
import enumOptionsIndexForValue from './enumOptionsIndexForValue';

/** Computes the value to pass to a select element's `value` attribute.
 *
 * When `useRealValues` is true, converts form data values to strings.
 * When `useRealValues` is false, resolves to index-based values via `enumOptionsIndexForValue`.
 * Returns `emptyValue` when the current value is empty/undefined.
 *
 * @param value - The current form data value
 * @param enumOptions - The available enum options
 * @param multiple - Whether the select allows multiple selections
 * @param useRealValues - Whether real values or indices are used for encoding
 * @param emptyValue - The value to return when the selection is empty
 * @returns The value to use for the select element's `value` attribute
 */
export default function enumOptionSelectedValue<S extends StrictRJSFSchema = RJSFSchema>(
  value: any,
  enumOptions: EnumOptionsType<S>[] | undefined,
  multiple: boolean,
  useRealValues: boolean,
  emptyValue?: any,
): any {
  const isEmpty =
    typeof value === 'undefined' ||
    (multiple && Array.isArray(value) && value.length < 1) ||
    (!multiple && value === emptyValue);

  if (isEmpty) {
    return emptyValue;
  }

  if (useRealValues) {
    return multiple ? value.map(String) : String(value);
  }

  const indexes = enumOptionsIndexForValue<S>(value, enumOptions, multiple);
  return typeof indexes === 'undefined' ? emptyValue : indexes;
}
