import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Whether a `FieldTemplate` in a theme whose widgets draw their own label draws the field's label: only where the
 * field's plan gives the label to the template and there is label text to draw. Unlike `templateDrawsLabel()`, it
 * draws none for a template rendered without a plan: such a theme's widgets then draw their own label, which one drawn
 * from the deprecated `displayLabel` would repeat
 *
 * @param props - The template's `label` and `presentation`
 * @returns - True when the template draws the label
 */
export default function templateDrawsPlannedLabel<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<FieldTemplateProps<T, S, F>, 'label' | 'presentation'>): boolean {
  const { label, presentation } = props;
  return presentation?.label.by === 'template' && !!label;
}
