import hasWidgetErrors from './hasWidgetErrors.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** Whether the field a widget renders shows errors of its own, for the error state of the label and description the
 * widget draws for it: its plan's `errors.own`, the field's own errors as its `ui:hideError` leaves them, whoever draws
 * them, as `SchemaField` marks the field's wrapper. Unlike `hasWidgetErrors()`, the control's state, it is off beneath
 * an `anyOf`/`oneOf` option that hides its errors while the field above shows them. For a widget rendered without a
 * plan, the two agree, so it falls back to `hasWidgetErrors()`
 *
 * @param props - The widget's `rawErrors`, `hideError` and `presentation`
 * @returns - True when the field shows errors of its own
 */
export default function fieldShowsOwnErrors<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<WidgetProps<T, S, F>, 'rawErrors' | 'hideError' | 'presentation'>): boolean {
  const { presentation } = props;
  return presentation ? presentation.errors.own : hasWidgetErrors<T, S, F>(props);
}
