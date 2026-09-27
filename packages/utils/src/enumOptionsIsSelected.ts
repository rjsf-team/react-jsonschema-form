import deepEquals from './deepEquals.ts';
import type { EnumOptionsType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Determines whether the given `value` is (one of) the `selected` value(s). An array `selected` is read as a list of
 * selections unless `multiple` is `false`, which a single-select widget passes so that an array is compared whole, as
 * the selection of an option whose value is an array, e.g. the `[2]` of a `{ const: [2] }` constant.
 *
 * @param value - The value being checked to see if it is selected
 * @param selected - The current selected value or list of values
 * @param [multiple] - Whether `selected` is a list of selections; when omitted, an array `selected` is one
 * @returns - true if the `value` is the `selected` one, or one of them for a list of selections, false otherwise
 */
export default function enumOptionsIsSelected<S extends StrictRJSFSchema = RJSFSchema>(
  value: EnumOptionsType<S>['value'],
  selected: EnumOptionsType<S>['value'] | EnumOptionsType<S>['value'][],
  multiple?: boolean,
) {
  if (multiple !== false && Array.isArray(selected)) {
    return selected.some((sel) => deepEquals(sel, value));
  }
  return deepEquals(selected, value);
}
