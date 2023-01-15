import { EnumOptionsType, RJSFSchema, StrictRJSFSchema } from "./types";

/** Add the `value` to the list of `selected` values in the proper order as defined by `allEnumOptions`
 *
 * @param value - The value that should be selected
 * @param selected - The current list of selected values
 * @param allEnumOptions - The list of all the known enumOptions
 * @returns - The updated list of selected enum values with `value` added to it in the proper location
 */
export default function enumOptionsSelectValue<
  S extends StrictRJSFSchema = RJSFSchema
>(
  value: EnumOptionsType<S>["value"],
  selected: EnumOptionsType<S>["value"][],
  allEnumOptions: EnumOptionsType<S>[] = []
) {
  const all = allEnumOptions.map(({ value }) => value);
  const at = all.indexOf(value);
  // If location of the value is not in the list of all enum values, just put it at the end
  const updated =
    at === -1
      ? selected.concat(value)
      : selected.slice(0, at).concat(value, selected.slice(at));
  // As inserting values at predefined index positions doesn't work with empty
  // arrays, we need to reorder the updated selection to match the initial order
  return updated.sort((a, b) => Number(all.indexOf(a) > all.indexOf(b)));
}
