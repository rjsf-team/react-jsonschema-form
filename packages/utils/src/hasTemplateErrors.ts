import hasVisibleErrors from './hasVisibleErrors.ts';
import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Whether the field a template renders has errors to show, for the template's error state (a red outline, an invalid
 * status): the messages its plan shows, with `ui:hideError` applied, or, for a template rendered without a plan, the
 * deprecated `rawErrors` while `hideError` is off. The one place a template reads `rawErrors`
 *
 * @param props - The template's `rawErrors`, `hideError` and `presentation`
 * @returns - True when the field has errors to show
 */
export default function hasTemplateErrors<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<FieldTemplateProps<T, S, F>, 'rawErrors' | 'hideError' | 'presentation'>): boolean {
  const { presentation } = props;
  if (presentation) {
    return presentation.errors.messages.length > 0;
  }
  return hasVisibleErrors(props);
}
