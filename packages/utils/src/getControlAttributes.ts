import getControlDescribedBy from './getControlDescribedBy.ts';
import type { ControlAttributes, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** Gets the ARIA attributes a widget spreads onto the focusable element that carries its `id`: those its field's plan
 * gives its control, followed in `aria-describedby` by the ids of the elements the widget renders to describe that
 * control itself, such as its examples list, as `getControlDescribedBy()` gives them. The plan's `required` is left to
 * the widget's own `required` prop, which a widget may turn off, as `FileWidget` does once a file is chosen. A control
 * whose label the field handing the widget its plan draws itself, as `drawnByField` says, and which nothing else names,
 * is named by the label's text through `aria-label`, since the widget draws no label to name it by. A field that draws a
 * `<label for>` naming that control gives its own `aria-labelledby` in the `control.attributes` of the plan it hands
 * down, since that `aria-label` would replace the label's name. A control the field renders itself takes the plan's
 * `control.attributes`, which carry no such name, rather than these.
 *
 * @param props - The widget's `id` and `presentation`
 * @param [ownDescribedBy=[]] - The ids of the elements the widget renders to describe its control
 * @returns - The `aria-labelledby`, `aria-label`, `aria-describedby` and `aria-invalid` to spread onto the control
 */
export default function getControlAttributes<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  props: Pick<WidgetProps<T, S, F>, 'id' | 'presentation'>,
  ownDescribedBy: readonly string[] = [],
): Omit<ControlAttributes, 'required'> {
  const { presentation } = props;
  const describedBy = getControlDescribedBy<T, S, F>(props, ownDescribedBy);
  const {
    required: _required,
    'aria-describedby': _describedBy,
    ...attributes
  } = presentation?.control?.attributes ?? {};
  // The field handing the widget its plan draws the label, which may name nothing, as a heading doesn't, and the widget
  // then draws none (#5591)
  if (
    presentation?.label.by === 'self' &&
    presentation.label.text &&
    presentation.drawnByField?.includes('label') &&
    !attributes['aria-labelledby'] &&
    !attributes['aria-label']
  ) {
    attributes['aria-label'] = presentation.label.text;
  }
  return describedBy ? { ...attributes, 'aria-describedby': describedBy } : attributes;
}
