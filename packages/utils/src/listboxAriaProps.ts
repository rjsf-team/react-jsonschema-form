import getControlFallbackName from './getControlFallbackName.ts';
import getLabelId from './getLabelId.ts';
import isLabelledByTemplate from './isLabelledByTemplate.ts';
import type { ControlAttributes, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** Gets the name of the list of options a `SelectWidget` shows, which a `<label for>` naming its combobox can't name:
 * the elements its combobox's `aria-labelledby` lists, else its combobox's `aria-label` unless it is empty, else, where
 * its field's plan says a label outside the widget names the combobox, that label's text, through the id `getLabelId()`
 * gives it, which a required field's marker is drawn outside of, as it is for a group. Otherwise it is the name
 * `getControlFallbackName()` gives it. Exactly one of the two attributes is returned, never empty
 *
 * @param props - The widget's `id`, `label`, `placeholder`, `presentation` and `registry`
 * @param controlAttributes - The `aria-labelledby` and `aria-label` `widgetAriaProps()` gives the combobox
 * @returns - The `aria-labelledby` or the `aria-label` to give the list of options
 */
export default function listboxAriaProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  props: Pick<WidgetProps<T, S, F>, 'id' | 'label' | 'placeholder' | 'presentation' | 'registry'>,
  controlAttributes: Pick<ControlAttributes, 'aria-labelledby' | 'aria-label'>,
): Pick<ControlAttributes, 'aria-labelledby' | 'aria-label'> {
  const { 'aria-labelledby': ariaLabelledby, 'aria-label': ariaLabel } = controlAttributes;
  if (ariaLabelledby) {
    return { 'aria-labelledby': ariaLabelledby };
  }
  if (ariaLabel) {
    return { 'aria-label': ariaLabel };
  }
  if (props.presentation && isLabelledByTemplate(props.presentation)) {
    return { 'aria-labelledby': getLabelId<T, S, F>(props) };
  }
  return { 'aria-label': getControlFallbackName<T, S, F>(props) };
}
