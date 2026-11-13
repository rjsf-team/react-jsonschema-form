import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** Gets the error messages a widget, or a container template, draws itself: the messages its field's plan shows, with
 * `ui:hideError` applied, where the plan's `errors.by` is `'self'`, and none where they are drawn elsewhere, as by the
 * `FieldTemplate`, below an `anyOf`/`oneOf` option by the field above, or by the field component the form's author
 * supplies that handed the widget its plan, as `drawnByField` says. For a component rendered without a plan,
 * the deprecated `rawErrors` while `hideError` is off. The one place such a component reads `rawErrors` for its messages
 *
 * @param props - The component's `rawErrors`, `hideError` and `presentation`
 * @returns - The messages to draw
 */
export default function getErrorsToDraw<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<WidgetProps<T, S, F>, 'rawErrors' | 'hideError' | 'presentation'>): readonly string[] {
  const { presentation } = props;
  if (presentation) {
    return presentation.errors.by === 'self' && !presentation.drawnByField?.includes('errors')
      ? presentation.errors.messages
      : [];
  }
  // oxlint-disable-next-line typescript/no-deprecated -- the fallback for a component rendered without a plan
  return props.hideError ? [] : (props.rawErrors ?? []);
}
