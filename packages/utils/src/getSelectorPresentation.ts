import isLabelledByTemplate from './isLabelledByTemplate.ts';
import type { FieldPresentation, PartPresentation } from './types.ts';

/** Gets a part of a field's plan as its selector reads it: the selector draws a part the field draws itself, since it is
 * the component that does, and a part drawn elsewhere is drawn above it
 */
function asSelectorPart<P extends PartPresentation>(part: P): P {
  return part.by === 'template' ? { ...part, by: 'above' } : part;
}

/** Derives the plan of the selector a field renders to pick its `anyOf`/`oneOf` option from the field's plan. The
 * selector draws the parts the field's plan has the field draw itself, as a theme whose template draws no label
 * declares, and is named and described by the parts drawn above it: named through `aria-labelledby`, since the `for` of
 * a template's label names the field's own control rather than the selector, and described by the parts that render,
 * marked invalid while the field shows errors. It has no `required` of its own, since it always holds an option. The
 * plan is that of the field rendering the options, so a component rendered beside them, such as a custom field or an
 * object with properties, hands it none of the parts it draws itself
 *
 * @param field - The plan of the field the selector picks the option of
 * @param selectorId - The id of the selector, which is its own
 * @returns - The selector's plan, with no control when the field has none on screen
 */
export default function getSelectorPresentation(field: FieldPresentation, selectorId: string): FieldPresentation {
  let control: FieldPresentation['control'];
  if (field.control) {
    const { required: _required, 'aria-labelledby': _labelledBy, ...attributes } = field.control.attributes;
    control = {
      id: selectorId,
      attributes: isLabelledByTemplate(field) ? { ...attributes, 'aria-labelledby': field.label.id } : attributes,
      requiredMarker: false,
    };
  }
  return {
    label: asSelectorPart(field.label),
    description: asSelectorPart(field.description),
    help: asSelectorPart(field.help),
    errors: asSelectorPart(field.errors),
    describedBy: field.describedBy,
    control,
    inherited: field,
  };
}
