import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** Whether a widget draws its field's label itself: where the field's plan says the widget draws it, or, for a widget
 * rendered without a plan, unless the deprecated `hideLabel` turns it off. The one place a widget reads `hideLabel`.
 * A field with no label can still leave its description to the widget, so a widget that draws its own description
 * takes it from `getWidgetDescription()` rather than gating it on this
 *
 * @param props - The widget's `hideLabel` and `presentation`
 * @returns - True when the widget draws the label
 */
export default function widgetDrawsLabel<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<WidgetProps<T, S, F>, 'hideLabel' | 'presentation'>): boolean {
  const { presentation } = props;
  // oxlint-disable-next-line typescript/no-deprecated -- the fallback for a widget rendered without a plan
  return presentation ? presentation.label.by === 'self' : !props.hideLabel;
}
