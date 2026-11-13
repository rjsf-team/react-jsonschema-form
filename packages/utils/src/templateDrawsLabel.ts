import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Whether a `FieldTemplate` draws its field's label: where the field's plan says the template draws it, or, for a
 * template rendered without a plan, as one rendered outside `SchemaField` is, where the deprecated `displayLabel` says
 * so. The one place a template reads `displayLabel`
 *
 * @param props - The template's `displayLabel` and `presentation`
 * @returns - True when the template draws the label
 */
export default function templateDrawsLabel<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<FieldTemplateProps<T, S, F>, 'displayLabel' | 'presentation'>): boolean {
  const { presentation } = props;
  // oxlint-disable-next-line typescript/no-deprecated -- the fallback for a template rendered without a plan
  return presentation ? presentation.label.by === 'template' : Boolean(props.displayLabel);
}
