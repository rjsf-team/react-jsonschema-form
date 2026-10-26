import type { VisibleErrorsProps } from './getVisibleErrors.ts';
import getVisibleErrors from './getVisibleErrors.ts';

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
  // oxlint-disable-next-line typescript/no-deprecated -- its boolean form, deprecated with it and kept through v7
  return getVisibleErrors(props).length > 0;
}
