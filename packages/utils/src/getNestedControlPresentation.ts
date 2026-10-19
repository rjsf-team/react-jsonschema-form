import resolveFieldPresentation from './resolveFieldPresentation.ts';
import type { ControlAttributes, FieldPresentation, ResolvedPresentationDeclaration } from './types.ts';

/** A nested control has no description, help or errors of its own, so it draws whatever it has itself */
const NESTED_DECLARATION: ResolvedPresentationDeclaration = Object.freeze({
  label: 'self',
  description: 'self',
  errors: 'self',
  help: 'self',
  labelledBy: 'for',
});

/** A nested control whose template draws its label beside it, with a `for` naming it */
const TEMPLATE_LABELLED_DECLARATION: ResolvedPresentationDeclaration = Object.freeze({
  ...NESTED_DECLARATION,
  label: 'template',
});

/** What `getNestedControlPresentation()` plans a nested control from */
export interface NestedControlInputs {
  /** The id of the control, its own rather than its field's */
  id: string;
  /** The control's name, which it draws as its own label where `showLabel` lets it, and is otherwise named by through
   * `aria-label`
   */
  label: string;
  /** Whether the control draws its own label. Defaults to false */
  showLabel?: boolean;
  /** Whether the template it sits in draws its label, with a `for` naming its id, beside it, over `showLabel`. Defaults
   * to false
   */
  labelledByTemplate?: boolean;
  /** Whether the control is required */
  required?: boolean;
  /** The plan of the field the control sits in, if it has one */
  field?: FieldPresentation;
}

/** Gets the plan of a control a widget or template renders inside its field under an id of its own, such as each date
 * part of an `AltDateWidget` or the `propertyNames` key select of an additional property, so the `SelectWidget` it
 * renders reads it as it reads any field's. It has no description, help or errors of its own, and is named by the label
 * its template draws beside it where `labelledByTemplate` says it does, draws its own label where `showLabel` lets it,
 * and is otherwise named by the label's text through `aria-label`, as a field whose label `ui:label: false` hides is.
 * Given the plan of the field it sits in, it is described by that field's parts that render and is `aria-invalid`
 * while that field's errors show, but doesn't take that field's `aria-labelledby` or `aria-label`,
 * which would outrank its own name
 *
 * @param inputs - The control's id, name, who draws that name, whether it is required, and its field's plan
 * @returns - The control's plan
 */
export default function getNestedControlPresentation(inputs: NestedControlInputs): FieldPresentation {
  const { id, label, showLabel = false, labelledByTemplate = false, required, field } = inputs;
  const plan = resolveFieldPresentation({
    id,
    declaration: labelledByTemplate ? TEMPLATE_LABELLED_DECLARATION : NESTED_DECLARATION,
    label,
    showLabel: showLabel || labelledByTemplate,
    required,
  });
  const fieldAttributes = field?.control?.attributes;
  if (!fieldAttributes) {
    return plan;
  }
  const { 'aria-describedby': describedBy, 'aria-invalid': invalid } = fieldAttributes;
  const attributes: ControlAttributes = {
    ...plan.control?.attributes,
    ...(describedBy && { 'aria-describedby': describedBy }),
    ...(invalid && { 'aria-invalid': invalid }),
  };
  return { ...plan, describedBy: field.describedBy, control: { id, attributes } };
}
