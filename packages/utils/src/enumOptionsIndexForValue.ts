import enumOptionsIsSelected from './enumOptionsIsSelected.ts';
import type { EnumOptionsType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Returns the index(es) of the options in `allEnumOptions` whose value(s) match the ones in `value`. All the
 * `enumOptions` are filtered based on whether they are a "selected" `value` and the index of each selected one is then
 * stored in an array. If `multiple` is true, that array is returned. Otherwise the index of an option whose value is
 * the whole `value` is returned, such as an array option's for an array `value`, falling back to the first element in
 * that array.
 *
 * @param value - The single value or list of values for which indexes are desired
 * @param [allEnumOptions=[]] - The list of all the known enumOptions
 * @param [multiple=false] - Optional flag, if true will return a list of index, otherwise a single one
 * @returns - A single string index for the first `value` in `allEnumOptions`, if not `multiple`. Otherwise, the list
 *        of indexes for (each of) the value(s) in `value`.
 */
export default function enumOptionsIndexForValue<S extends StrictRJSFSchema = RJSFSchema>(
  value: unknown,
  allEnumOptions: EnumOptionsType<S>[] = [],
  multiple = false,
): string | string[] | undefined {
  if (!multiple) {
    // An array is the whole value of an array option first, and only then a list whose first matching entry is taken
    let index = allEnumOptions.findIndex((opt) => enumOptionsIsSelected(opt.value, value, false));
    if (index === -1 && Array.isArray(value)) {
      index = allEnumOptions.findIndex((opt) => enumOptionsIsSelected(opt.value, value, true));
    }
    return index === -1 ? undefined : String(index);
  }
  return allEnumOptions
    .map((opt, index) => (enumOptionsIsSelected(opt.value, value) ? String(index) : undefined))
    .filter((opt) => typeof opt !== 'undefined');
}
