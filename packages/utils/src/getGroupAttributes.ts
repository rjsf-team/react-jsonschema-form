import getControlAttributes from './getControlAttributes.ts';
import type { ControlAttributes, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** The role of the element wrapping a group of controls: `radiogroup` for radios, `group` for anything else */
export type GroupRole = 'radiogroup' | 'group';

/** Gets the ARIA attributes a widget rendering a group of controls, such as radios or checkboxes, spreads onto the
 * group's wrapper and onto each control in it. A label's `for` reaches a single control rather than the element
 * wrapping a group, so the wrapper takes the `aria-labelledby` its field's plan gives the control, or the `aria-label`
 * it gives one whose label `ui:label: false` hides, and each control the `aria-describedby` `getControlAttributes()`
 * gives it. The wrapper takes the `role` too, so `aria-invalid` always lands on the role it was placed for.
 * `aria-invalid` goes where ARIA supports it: on a `radiogroup` rather than on its radios, and on each control of a
 * `group`, such as its checkboxes, rather than on the group.
 *
 * A widget that draws its own label for the group, which the plan points nothing at, passes that label's id, so the
 * group is named by it where the plan names the group by no other label: one rule for every theme whose group widgets
 * draw their label, rather than a fallback of each theme's own. Under a plan the id is taken only where the plan gives
 * the widget the label, so a widget can pass it whether or not it draws one: a hidden label, or one the template draws
 * with a `for`, leaves the group pointing at no label the widget doesn't draw. Without a plan the caller is trusted.
 *
 * @param props - The widget's `id` and `presentation`
 * @param role - The role of the group's wrapper
 * @param [drawnLabelId] - The id of the label the widget draws for the group itself, where it draws one
 * @returns - `group`, the `role` and attributes for the group's wrapper, and `option`, those for each control in it
 */
export default function getGroupAttributes<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  props: Pick<WidgetProps<T, S, F>, 'id' | 'presentation'>,
  role: GroupRole,
  drawnLabelId?: string,
): {
  group: Pick<ControlAttributes, 'aria-labelledby' | 'aria-label' | 'aria-invalid'> & { role: GroupRole };
  option: Omit<ControlAttributes, 'aria-labelledby' | 'aria-label' | 'required'>;
} {
  const {
    'aria-labelledby': plannedLabelledBy,
    'aria-label': ariaLabel,
    'aria-invalid': invalid,
    ...described
  } = getControlAttributes<T, S, F>(props);
  const { presentation } = props;
  const drawsOwnLabel = presentation ? presentation.label.by === 'self' : true;
  const labelledBy = plannedLabelledBy || (drawsOwnLabel ? drawnLabelId : undefined);
  const invalidAttribute = invalid && { 'aria-invalid': invalid };
  const groupTakesInvalid = role === 'radiogroup';
  return {
    group: {
      role,
      ...(labelledBy && { 'aria-labelledby': labelledBy }),
      ...(ariaLabel && { 'aria-label': ariaLabel }),
      ...(groupTakesInvalid && invalidAttribute),
    },
    option: { ...described, ...(!groupTakesInvalid && invalidAttribute) },
  };
}
