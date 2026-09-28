import deepEquals from './deepEquals.ts';
import enumOptionsValueForIndex from './enumOptionsValueForIndex.ts';
import type { EnumOptionsType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Add the enum option value at the `valueIndex` to the list of `selected` values in the proper order as defined by
 * `allEnumOptions`. Values are compared by deep equality, so an object or array option finds its place whether or not
 * `selected` holds the option's own instance. A value already selected isn't added again, and a selected value that
 * matches no option keeps its place after the ones that do.
 *
 * @param valueIndex - The index of the value that should be selected
 * @param selected - The current list of selected values
 * @param [allEnumOptions=[]] - The list of all the known enumOptions
 * @returns - The updated list of selected enum values with enum value at the `valueIndex` added to it
 */
export default function enumOptionsSelectValue<S extends StrictRJSFSchema = RJSFSchema>(
  valueIndex: string | number,
  selected: EnumOptionsType<S>['value'][],
  allEnumOptions: EnumOptionsType<S>[] = [],
): unknown[] {
  // `undefined` marks an index with no option, since a JSON value (including `null`) is never `undefined`
  const value = enumOptionsValueForIndex<S>(valueIndex, allEnumOptions);
  if (value === undefined || selected.some((val) => deepEquals(val, value))) {
    return selected;
  }
  // Each position is a deep-equality scan of the options, so it's found once per value rather than per comparison
  return [...selected, value]
    .map((val) => {
      const position = allEnumOptions.findIndex((opt) => deepEquals(opt.value, val));
      return { val, position: position === -1 ? Infinity : position };
    })
    .sort((a, b) => a.position - b.position)
    .map(({ val }) => val);
}
