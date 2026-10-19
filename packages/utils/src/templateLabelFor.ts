import type { FieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** The `for` of the label a `FieldTemplate` draws: the field's `id`, except where the field's plan names the control
 * through `aria-labelledby`, as for a group of radios or checkboxes, whose wrapper carries the `id` and isn't an element
 * a `for` can label. That label names the control through its own `presentation.label.id` instead
 *
 * @param props - The template's `id` and `presentation`
 * @returns - The `for` of the template's label, or undefined when it should have none
 */
export default function templateLabelFor<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<FieldTemplateProps<T, S, F>, 'id' | 'presentation'>): string | undefined {
  const { id, presentation } = props;
  return presentation?.control?.attributes['aria-labelledby'] ? undefined : id;
}
