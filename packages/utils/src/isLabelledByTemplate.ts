import type { FieldPresentation } from './types.ts';

/** Whether the field's label is drawn outside its component: by its template, or `above` it by a field above rendering
 * the same id, as the template of an `anyOf`/`oneOf` field draws the label of its selected option. An `above` label
 * counts whoever draws it, so a container's heading above a level with no control counts too. A widget whose contents
 * would otherwise name it, such as a button displaying its value, reads this to know its name comes from outside
 *
 * @param presentation - The field's plan
 * @returns - True when the label is drawn by the template or above
 */
export default function isLabelledByTemplate({ label }: FieldPresentation): boolean {
  return label.by === 'template' || label.by === 'above';
}
