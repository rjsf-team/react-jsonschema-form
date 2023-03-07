import isEqual from 'lodash/isEqual';

import { EnumOptionsType, RJSFSchema, StrictRJSFSchema } from './types';

/** Determines whether the given `value` is (one of) the `selected` value(s).
 *
 * @param value - The value being checked to see if it is selected
 * @param selected - The current selected value or list of values
 * @returns - true if the `value` is one of the `selected` ones, false otherwise
 */
export default function enumOptionsIsSelected<S extends StrictRJSFSchema = RJSFSchema>(
  value: EnumOptionsType<S>['value'],
  selected: EnumOptionsType<S>['value'] | EnumOptionsType<S>['value'][]
) {
  if (Array.isArray(selected)) {
    return selected.some((sel) => isEqual(sel, value));
  }
  return isEqual(selected, value);
}
