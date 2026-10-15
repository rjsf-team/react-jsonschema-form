import getControlAttributes from './getControlAttributes.ts';
import type { ControlAttributes, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** The role of the element wrapping a group of controls: `radiogroup` for radios, `group` for anything else */
export type GroupRole = 'radiogroup' | 'group';

/** Gets the ARIA attributes a widget rendering a group of controls, such as radios or checkboxes, spreads onto the
 * group's wrapper and onto each control in it. A label's `for` reaches a single control rather than the element
 * wrapping a group, so the wrapper takes the `aria-labelledby` its field's plan gives the control, and each control the
 * `aria-describedby` `getControlAttributes()` gives it. The wrapper takes the `role` too, so `aria-invalid` always lands
 * on the role it was placed for. `aria-invalid` goes where ARIA supports it: on a `radiogroup`
 * rather than on its radios, and on each control of a `group`, such as its checkboxes, rather than on the group.
 *
 * @param props - The widget's `id` and `presentation`
 * @param role - The role of the group's wrapper
 * @returns - `group`, the `role` and attributes for the group's wrapper, and `option`, those for each control in it
 */
export default function getGroupAttributes<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  props: Pick<WidgetProps<T, S, F>, 'id' | 'presentation'>,
  role: GroupRole,
): {
  group: Pick<ControlAttributes, 'aria-labelledby' | 'aria-invalid'> & { role: GroupRole };
  option: Omit<ControlAttributes, 'aria-labelledby' | 'required'>;
} {
  const { 'aria-labelledby': labelledBy, 'aria-invalid': invalid, ...described } = getControlAttributes<T, S, F>(props);
  const group: Pick<ControlAttributes, 'aria-labelledby' | 'aria-invalid'> & { role: GroupRole } = labelledBy
    ? { role, 'aria-labelledby': labelledBy }
    : { role };
  const option: Omit<ControlAttributes, 'aria-labelledby' | 'required'> = described;
  if (invalid) {
    if (role === 'radiogroup') {
      group['aria-invalid'] = invalid;
    } else {
      option['aria-invalid'] = invalid;
    }
  }
  return { group, option };
}
