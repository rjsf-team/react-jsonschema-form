import enumOptionsIsDisabled from './enumOptionsIsDisabled.ts';
import type { EnumOptionsType, EnumValue, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Gets the index of the option a `RadioWidget` or `CheckboxesWidget` focuses under `ui:autofocus`: the first one the
 * `ui:enumDisabled` list leaves enabled, since a disabled option can't take focus
 *
 * @param enumOptions - The widget's options
 * @param [enumDisabled] - The `ui:enumDisabled` list of enum values that should be rendered disabled
 * @param [autofocus=false] - Whether the widget is to take focus as it mounts
 * @returns - The index of the option to focus, or -1 where the widget takes no focus or every option is disabled
 */
export default function enumOptionsAutofocusIndex<S extends StrictRJSFSchema = RJSFSchema>(
  enumOptions: EnumOptionsType<S>[] | undefined,
  enumDisabled?: EnumValue[],
  autofocus = false,
): number {
  return autofocus ? (enumOptions ?? []).findIndex((option) => !enumOptionsIsDisabled(option.value, enumDisabled)) : -1;
}
