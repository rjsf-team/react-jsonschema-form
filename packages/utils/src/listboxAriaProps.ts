import getControlFallbackName from './getControlFallbackName.ts';
import type { ControlAttributes, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** Gets the name of the list of options a `SelectWidget` shows, which a `<label for>` naming its combobox can't name:
 * the elements its combobox's `aria-labelledby` lists, else its combobox's `aria-label`, else the name
 * `getControlFallbackName()` gives it, which is what that label says. Exactly one of the two attributes is returned
 *
 * @param props - The widget's `label`, `placeholder` and `registry`
 * @param controlAttributes - The `aria-labelledby` and `aria-label` `widgetAriaProps()` gives the combobox
 * @returns - The `aria-labelledby` or the `aria-label` to give the list of options
 */
export default function listboxAriaProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  props: Pick<WidgetProps<T, S, F>, 'label' | 'placeholder' | 'registry'>,
  controlAttributes: Pick<ControlAttributes, 'aria-labelledby' | 'aria-label'>,
): Pick<ControlAttributes, 'aria-labelledby' | 'aria-label'> {
  const { 'aria-labelledby': ariaLabelledby, 'aria-label': ariaLabel } = controlAttributes;
  if (ariaLabelledby) {
    return { 'aria-labelledby': ariaLabelledby };
  }
  return { 'aria-label': ariaLabel ?? getControlFallbackName<T, S, F>(props) };
}
