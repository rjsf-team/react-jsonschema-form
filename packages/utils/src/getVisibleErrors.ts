/** The subset of props a widget or template needs in order to decide which of its errors to surface
 * @deprecated Kept through v7 with `getVisibleErrors()` and `hasVisibleErrors()`, which take it: type the props as
 *   `Pick<WidgetProps, 'rawErrors' | 'hideError' | 'presentation'>`, which `getErrorsToDraw()` and `hasWidgetErrors()`
 *   take, while a `FieldTemplate` reads its error state from its `hasErrors` prop
 */
export interface VisibleErrorsProps {
  /** The error messages, carried whatever `hideError` says */
  rawErrors?: string[];
  /** Whether `ui:hideError` hides them */
  hideError?: boolean;
}

/** Returns the list of errors that a widget or template should surface in its own UI, which is empty whenever
 * `ui:hideError` is in effect: `rawErrors` is deliberately still provided while errors are hidden, so that custom
 * widgets can render them their own way.
 *
 * @param props - The props of the widget or template, from which `rawErrors` and `hideError` are read
 * @returns - The errors to display, or an empty array when there are none or they are being hidden
 * @deprecated Kept through v7 for a component rendered without a plan: read `getErrorsToDraw()`, which gives the
 *   plan's `presentation.errors.messages`, with `ui:hideError` applied, only where `presentation.errors.by` is
 *   `'self'`, since the template draws them under `'template'`, and falls back to this without a plan
 */
// oxlint-disable-next-line typescript/no-deprecated -- its parameter type, deprecated with it and kept through v7
export default function getVisibleErrors({ rawErrors, hideError }: VisibleErrorsProps): string[] {
  return hideError ? [] : (rawErrors ?? []);
}
