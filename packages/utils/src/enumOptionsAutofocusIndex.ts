import enumOptionsIsDisabled from './enumOptionsIsDisabled.ts';
import enumOptionsIsSelected from './enumOptionsIsSelected.ts';
import type { EnumOptionsType, EnumValue, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Gets the index of the option a `RadioWidget` or `CheckboxesWidget` focuses under `ui:autofocus`. A radio group passes
 * its value, so focus lands on its checked option, where Tab into the group lands, rather than on an unchecked one that
 * Space would check. Otherwise, or where `ui:enumDisabled` disables the checked option, it is the first option that list
 * leaves enabled, since a disabled option can't take focus
 *
 * @param enumOptions - The widget's options
 * @param [enumDisabled] - The `ui:enumDisabled` list of enum values that should be rendered disabled
 * @param [autofocus=false] - Whether the widget is to take focus as it mounts
 * @param [checkedValue] - A radio group's value, whose option takes focus where it is enabled
 * @returns - The index of the option to focus, or -1 where the widget takes no focus or every option is disabled
 */
export default function enumOptionsAutofocusIndex<S extends StrictRJSFSchema = RJSFSchema>(
  enumOptions: EnumOptionsType<S>[] | undefined,
  enumDisabled?: EnumValue[],
  autofocus = false,
  checkedValue?: EnumOptionsType<S>['value'],
): number {
  if (!autofocus) {
    return -1;
  }
  const options = enumOptions ?? [];
  const isEnabled = (option: EnumOptionsType<S>) => !enumOptionsIsDisabled(option.value, enumDisabled);
  const checkedIndex = options.findIndex(
    (option) => isEnabled(option) && enumOptionsIsSelected<S>(option.value, checkedValue, false),
  );
  return checkedIndex === -1 ? options.findIndex(isEnabled) : checkedIndex;
}
