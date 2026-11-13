import getUiOptions from './getUiOptions.ts';
import type { ArrayFieldTemplateProps, FormContextType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Gets the description an array's template draws: the one its plan says the array draws itself, so an option repeating
 * its field's description, which a field above draws, doesn't draw it again. An array rendered without a plan draws its
 * `ui:description` or schema `description`
 *
 * @param props - The template's `schema`, `uiSchema` and `presentation`
 * @returns - The description the template draws, or undefined when it draws none
 */
export default function getArrayDescription<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: Pick<ArrayFieldTemplateProps<T, S, F>, 'schema' | 'uiSchema' | 'presentation'>): string | undefined {
  const { schema, uiSchema, presentation } = props;
  if (presentation) {
    const { description } = presentation;
    return description.by === 'self' ? description.text : undefined;
  }
  return getUiOptions<T, S, F>(uiSchema).description || schema.description;
}
