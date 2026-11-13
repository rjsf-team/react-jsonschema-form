import templateDrawsLabel from './templateDrawsLabel.ts';
import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Whether a `FieldTemplate` draws the description it is handed: where the field's plan says the template draws it, or,
 * for a template rendered without a plan, as one rendered outside `SchemaField` is, where it draws the label, since the
 * deprecated `displayLabel` gates both there
 *
 * @param props - The template's `displayLabel` and `presentation`
 * @returns - True when the template draws the description
 */
export default function templateDrawsDescription<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<FieldTemplateProps<T, S, F>, 'displayLabel' | 'presentation'>): boolean {
  const { presentation } = props;
  return presentation ? presentation.description.by === 'template' : templateDrawsLabel<T, S, F>(props);
}
