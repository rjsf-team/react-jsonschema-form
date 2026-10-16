import isLabelledByTemplate from './isLabelledByTemplate.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';
import widgetDrawsLabelText from './widgetDrawsLabelText.ts';

/** Whether a label the `FieldTemplate` draws names a widget's control, so the widget needs no name of its own. Under its
 * field's plan, that is a label the template draws, here or for a field above rendering the same id, as
 * `isLabelledByTemplate()` says. Without a plan the widget answers from what it is handed: a label that isn't hidden,
 * with text. A template draws no other text in its place, neither the property name, which `SchemaField` already made
 * the label of a field with no title, nor a required field's `*` alone, which would name the control "star"
 *
 * @param props - The widget's `label`, `hideLabel` and `presentation`
 * @returns - True when a label the template draws names the control
 */
export default function isNamedByTemplateLabel<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<WidgetProps<T, S, F>, 'label' | 'hideLabel' | 'presentation'>): boolean {
  const { presentation } = props;
  if (presentation) {
    return isLabelledByTemplate(presentation);
  }
  return widgetDrawsLabelText<T, S, F>(props);
}
