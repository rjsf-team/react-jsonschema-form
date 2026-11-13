import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Whether a `FieldTemplate`, or a widget drawing its own label, marks that label as required: where the field's plan
 * says so, which leaves the marker off a control declared `uncheckedIsFalse` whose schema doesn't demand `true` (#5388)
 * and off a level whose field above already draws it, and puts it on the label an `anyOf`/`oneOf` selector draws for its
 * field, or, for one rendered without a plan, where the field is `required`. A widget keeps its control's own `required`
 * apart from this
 *
 * @param props - The component's `required` and `presentation`
 * @returns - True when the label carries the required marker
 */
export default function templateMarksRequired<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<FieldTemplateProps<T, S, F>, 'required' | 'presentation'>): boolean {
  const { required, presentation } = props;
  return presentation ? presentation.label.requiredMarker : Boolean(required);
}
