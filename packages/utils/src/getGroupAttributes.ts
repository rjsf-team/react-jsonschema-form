import getControlAttributes from './getControlAttributes.ts';
import type { ControlAttributes, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** Gets the ARIA attributes a widget rendering a group of controls, such as radios or checkboxes, spreads onto the
 * group's wrapper and onto each control in it. A label's `for` reaches a single control rather than the element
 * wrapping a group, so the wrapper takes the `aria-labelledby` its field's plan gives the control, and each control the
 * `aria-describedby` and `aria-invalid` `getControlAttributes()` gives it.
 *
 * @param props - The widget's `id` and `presentation`
 * @returns - `group`, the attributes for the group's wrapper, and `option`, those for each control in it
 */
export default function getGroupAttributes<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  props: Pick<WidgetProps<T, S, F>, 'id' | 'presentation'>,
): {
  group: Pick<ControlAttributes, 'aria-labelledby'>;
  option: Omit<ControlAttributes, 'aria-labelledby' | 'required'>;
} {
  const { 'aria-labelledby': labelledBy, ...option } = getControlAttributes<T, S, F>(props);
  return { group: labelledBy ? { 'aria-labelledby': labelledBy } : {}, option };
}
