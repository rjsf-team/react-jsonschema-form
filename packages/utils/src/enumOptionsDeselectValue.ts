import { EnumOptionsType, RJSFSchema, StrictRJSFSchema } from "./types";

/** Removes the `value` from the currently `selected` list of values
 *
 * @param value - The value to be removed from the selected list
 * @param selected - The current list of selected values
 * @returns - The updated `selected` list with the `value` removed from it
 */
export default function enumOptionsDeselectValue<
  S extends StrictRJSFSchema = RJSFSchema
>(value: EnumOptionsType<S>["value"], selected: EnumOptionsType<S>["value"][]) {
  return selected.filter((v) => v !== value);
}
