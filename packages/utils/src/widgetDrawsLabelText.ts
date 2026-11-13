import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';
import widgetDrawsLabel from './widgetDrawsLabel.ts';

/** Whether a widget draws a label of its own with text in it: where `widgetDrawsLabel()` says it draws its field's
 * label and that label has text. A label holding only a required field's `*` would name the control "star", so a widget
 * draws none in its place
 *
 * @param props - The widget's `label`, `hideLabel` and `presentation`
 * @returns - True when the widget draws a label with text
 */
export default function widgetDrawsLabelText<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<WidgetProps<T, S, F>, 'label' | 'hideLabel' | 'presentation'>): boolean {
  return widgetDrawsLabel<T, S, F>(props) && !!props.label;
}
