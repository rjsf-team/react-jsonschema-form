import { descriptionId } from './idGenerators.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from './types.ts';

/** Gets the description a widget draws itself, as a checkbox does: the one its field's plan says the widget draws, under
 * the id the plan gives it. A widget rendered without a plan draws its `ui:description` or schema `description` unless
 * `hideLabel` turns its label off, an empty `ui:description` falling back to the schema's, as a field's description does. Without a plan it can't tell which description the theme's `FieldTemplate` draws:
 * `@rjsf/core`'s and `@rjsf/chakra-ui`'s draw it for a field whose `ui:widget` is the `checkbox` alias (#4825), so a
 * checkbox widget in those themes doesn't call it there, as their own `CheckboxWidget`s don't
 *
 * @param props - The widget's `id`, `options`, `schema`, `hideLabel` and `presentation`
 * @returns - The text and id of the description the widget draws, or undefined when it draws none
 */
export default function getWidgetDescription<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  id,
  options,
  schema,
  hideLabel,
  presentation,
}: Pick<WidgetProps<T, S, F>, 'id' | 'options' | 'schema' | 'hideLabel' | 'presentation'>):
  | { text: string; id: string }
  | undefined {
  if (presentation) {
    const { description } = presentation;
    return description.by === 'self' && description.text ? { text: description.text, id: description.id } : undefined;
  }
  const text = options.description || schema.description;
  return !hideLabel && text ? { text, id: descriptionId(id) } : undefined;
}
