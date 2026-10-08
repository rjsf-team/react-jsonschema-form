import type { WidgetProps } from './types.ts';

/** The subset of props a widget or template needs in order to decide which of its errors to surface */
export type VisibleErrorsProps = Pick<WidgetProps, 'rawErrors' | 'hideError'>;

/** Returns the list of errors that a widget or template should surface in its own UI, which is empty whenever
 * `ui:hideError` is in effect. Components rendering an error state (a red outline, an invalid flag, inline error
 * text) must derive it from this rather than from `rawErrors` directly, since `rawErrors` is deliberately still
 * provided while errors are hidden so that custom widgets can render them their own way.
 *
 * @param props - The props of the widget or template, from which `rawErrors` and `hideError` are read
 * @returns - The errors to display, or an empty array when there are none or they are being hidden
 */
export default function getVisibleErrors({ rawErrors, hideError }: VisibleErrorsProps): string[] {
  return hideError ? [] : (rawErrors ?? []);
}
