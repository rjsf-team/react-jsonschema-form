import type { ContainerFieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Whether an `ArrayFieldTemplate` or `ObjectFieldTemplate` lays out its optional data control in its heading, the one
 * it draws for the `title` its field hands it. A readonly or disabled container, and one drawing no heading, as under
 * `ui:label: false` or where a field above draws the text, lays the control out with its items or properties instead,
 * so the control isn't dropped with the heading
 *
 * @param props - The template's `title`, `readonly` and `disabled`
 * @returns - True when the heading lays out the optional data control
 */
export default function titleDrawsOptionalDataControl<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<ContainerFieldTemplateProps<T, S, F>, 'title' | 'readonly' | 'disabled'>): boolean {
  const { title, readonly, disabled } = props;
  return !readonly && !disabled && !!title;
}
