import getControlFallbackName from './getControlFallbackName.ts';
import isNamedByTemplateLabel from './isNamedByTemplateLabel.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** Gets the `aria-label` of a control that takes no name from what it displays, such as a combobox trigger: the
 * `aria-label` its caller or its field's plan gives it, else none where a label names it, either the one the widget
 * draws itself or one the `FieldTemplate` draws, as `isNamedByTemplateLabel()` says, else the name
 * `getControlFallbackName()` gives it. An empty `aria-label` names nothing, so it falls back like a missing one
 *
 * @param props - The widget's `label`, `hideLabel`, `placeholder`, `presentation` and `registry`
 * @param [ariaLabel] - The `aria-label` the caller or the plan gives the control, as `widgetAriaProps()` merges them
 * @param [drawsOwnLabel=false] - Whether the widget draws a label that names the control, as `widgetDrawsLabelText()`
 *        says for one that draws its field's label
 * @returns - The `aria-label`, or undefined where a label names the control
 */
export default function getControlAriaLabel<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  props: Pick<WidgetProps<T, S, F>, 'label' | 'hideLabel' | 'placeholder' | 'presentation' | 'registry'>,
  ariaLabel?: string,
  drawsOwnLabel = false,
): string | undefined {
  if (ariaLabel) {
    return ariaLabel;
  }
  if (drawsOwnLabel || isNamedByTemplateLabel<T, S, F>(props)) {
    return undefined;
  }
  return getControlFallbackName<T, S, F>(props);
}
