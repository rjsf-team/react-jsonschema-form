import hasVisibleErrors from './hasVisibleErrors.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** Whether a widget's control has errors to show, for the widget's error state (a red outline, an invalid status): as
 * its field's plan marks the control `aria-invalid`, whoever draws the messages, so an `anyOf`/`oneOf` option's control
 * is styled invalid while the field above draws its errors, or, for a widget rendered without a plan, the deprecated
 * `rawErrors` while `hideError` is off. The one place a widget reads `rawErrors`
 *
 * @param props - The widget's `rawErrors`, `hideError` and `presentation`
 * @returns - True when the widget's control has errors to show
 */
export default function hasWidgetErrors<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<WidgetProps<T, S, F>, 'rawErrors' | 'hideError' | 'presentation'>): boolean {
  const { presentation, hideError } = props;
  if (presentation) {
    return !!presentation.control?.attributes['aria-invalid'];
  }
  // oxlint-disable-next-line typescript/no-deprecated -- the fallback for a widget rendered without a plan
  return hasVisibleErrors({ rawErrors: props.rawErrors, hideError });
}
