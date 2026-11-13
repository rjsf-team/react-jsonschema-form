/** The subset of props a widget or template needs in order to decide which of its errors to surface
 * @deprecated Kept through v7 with `hasVisibleErrors()`, which takes it: type the props as
 *   `Pick<WidgetProps, 'rawErrors' | 'hideError' | 'presentation'>`, which `getErrorsToDraw()` and `hasWidgetErrors()`
 *   take, while a `FieldTemplate` reads its error state from its `hasErrors` prop
 */
export interface VisibleErrorsProps {
  /** The error messages, carried whatever `hideError` says */
  rawErrors?: string[];
  /** Whether `ui:hideError` hides them */
  hideError?: boolean;
}

/** Determines whether a widget or template has any errors to surface in its own UI, which is never the case while
 * `ui:hideError` is in effect: `rawErrors` is deliberately still provided while errors are hidden, so that custom
 * widgets can render them their own way.
 *
 * @param props - The props of the widget or template, from which `rawErrors` and `hideError` are read
 * @returns - True when there are errors the component should surface, otherwise false
 * @deprecated Kept through v7 for a component rendered without a plan: read `hasWidgetErrors()`, which falls back to
 *   this, or a template's `hasErrors` prop for an error state, and `getErrorsToDraw()` for the messages a component
 *   draws itself
 */
// oxlint-disable-next-line typescript/no-deprecated -- its parameter type, deprecated with it and kept through v7
export default function hasVisibleErrors(props: VisibleErrorsProps): boolean {
  return !props.hideError && (props.rawErrors?.length ?? 0) > 0;
}
