import getControlDescribedBy from './getControlDescribedBy.ts';
import type { ControlAttributes, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** Gets the ARIA attributes a widget spreads onto the focusable element that carries its `id`: those its field's plan
 * gives its control, followed in `aria-describedby` by the ids of the elements the widget renders to describe that
 * control itself, such as its examples list, as `getControlDescribedBy()` gives them. The plan's `required` is left to
 * the widget's own `required` prop, which a widget may turn off, as `FileWidget` does once a file is chosen.
 *
 * @param props - The widget's `id` and `presentation`
 * @param [ownDescribedBy=[]] - The ids of the elements the widget renders to describe its control
 * @returns - The `aria-labelledby`, `aria-describedby` and `aria-invalid` to spread onto the control
 */
export default function getControlAttributes<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  props: Pick<WidgetProps<T, S, F>, 'id' | 'presentation'>,
  ownDescribedBy: readonly string[] = [],
): Omit<ControlAttributes, 'required'> {
  const describedBy = getControlDescribedBy<T, S, F>(props, ownDescribedBy);
  const {
    required: _required,
    'aria-describedby': _describedBy,
    ...attributes
  } = props.presentation?.control?.attributes ?? {};
  return describedBy ? { ...attributes, 'aria-describedby': describedBy } : attributes;
}
