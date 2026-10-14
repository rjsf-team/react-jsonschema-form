import type { FieldPresentation } from './types.ts';

/** Whether a label a `FieldTemplate` draws names the field's control: the template's own, or one the template of a field
 * above rendering the same id draws, as for a selected `anyOf`/`oneOf` option. A widget whose contents would otherwise
 * name it, such as a button displaying its value, reads this to know its name comes from outside
 *
 * @param presentation - The field's plan
 * @returns - True when a template's label names the control
 */
export default function isLabelledByTemplate({ label }: FieldPresentation): boolean {
  return label.by === 'template' || label.by === 'above';
}
