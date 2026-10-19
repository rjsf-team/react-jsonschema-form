import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Whether a `FieldTemplate` marks the label it draws as required: where the field's plan says so, which leaves the
 * marker off a control declared `uncheckedIsFalse` whose schema doesn't demand `true` (#5388), or, for a template
 * rendered without a plan, where the field is `required`
 *
 * @param props - The template's `required` and `presentation`
 * @returns - True when the template's label carries the required marker
 */
export default function templateMarksRequired<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<FieldTemplateProps<T, S, F>, 'required' | 'presentation'>): boolean {
  const { required, presentation } = props;
  return presentation ? presentation.label.requiredMarker : Boolean(required);
}
