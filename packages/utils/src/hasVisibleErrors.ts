import type { VisibleErrorsProps } from './getVisibleErrors.ts';
import getVisibleErrors from './getVisibleErrors.ts';

/** Determines whether a widget or template has any errors to surface in its own UI, which is never the case while
 * `ui:hideError` is in effect. Components deciding whether to render an error state (a red outline, an invalid flag)
 * must derive it from this rather than from `rawErrors` directly, since `rawErrors` is deliberately still provided
 * while errors are hidden so that custom widgets can render them their own way.
 *
 * @param props - The props of the widget or template, from which `rawErrors` and `hideError` are read
 * @returns - True when there are errors the component should surface, otherwise false
 */
export default function hasVisibleErrors(props: VisibleErrorsProps): boolean {
  return getVisibleErrors(props).length > 0;
}
