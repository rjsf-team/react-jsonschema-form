import getDescribedControlAttributes from './getDescribedControlAttributes.ts';
import isLabelledByTemplate from './isLabelledByTemplate.ts';
import type { ControlAttributes, FieldPresentation, PartPresentation } from './types.ts';

/** Gets a part of a field's plan as its selector reads it: the selector draws a part the field draws itself, since it is
 * the component that does, and a part drawn elsewhere is drawn above it
 */
function asSelectorPart<P extends PartPresentation>(part: P): P {
  return part.by === 'template' ? { ...part, by: 'above' } : part;
}

/** Derives the plan of the selector a field renders to pick its `anyOf`/`oneOf` option from the field's plan. The
 * selector draws the parts the field's plan has the field draw itself, as a theme whose template draws no label
 * declares, and is named and described by the parts drawn above it: named through `aria-labelledby`, since the `for` of
 * a template's label names the field's own control rather than the selector, or by the `aria-label` the field's control
 * takes where `ui:label: false` hides its label, and described by the parts that render, marked invalid while the
 * field shows errors. It is neither required nor marked so, since it always holds an option. The plan is that of the
 * field rendering the options, so a component rendered beside them, such as a custom field or an object with
 * properties, hands it none of the parts it draws itself
 *
 * @param field - The plan of the field the selector picks the option of
 * @param selectorId - The id of the selector, which is its own
 * @returns - The selector's plan, with no control when the field has none on screen
 */
export default function getSelectorPresentation(field: FieldPresentation, selectorId: string): FieldPresentation {
  let control: FieldPresentation['control'];
  if (field.control) {
    // From the field's parts alone: its control's own describers, such as its examples list, describe that control
    const attributes: ControlAttributes = getDescribedControlAttributes(field.describedBy, field.errors.messages);
    const { 'aria-label': ariaLabel } = field.control.attributes;
    if (isLabelledByTemplate(field)) {
      attributes['aria-labelledby'] = field.label.id;
    } else if (ariaLabel) {
      attributes['aria-label'] = ariaLabel;
    }
    control = { id: selectorId, attributes };
  }
  return {
    label: { ...asSelectorPart(field.label), requiredMarker: false },
    description: asSelectorPart(field.description),
    help: asSelectorPart(field.help),
    errors: asSelectorPart(field.errors),
    describedBy: field.describedBy,
    showLabel: field.showLabel,
    control,
    inherited: field,
  };
}
