import type { ReactElement } from 'react';

import {
  descriptionId,
  errorId,
  examplesId,
  fieldLabelId,
  helpId,
  optionDescriptionId,
  optionHelpId,
  selectedOptionDescriptionId,
} from './idGenerators.ts';
import type {
  ControlAttributes,
  FieldPresentation,
  PartPlacement,
  PartPresentation,
  ResolvedPresentationDeclaration,
} from './types.ts';

/** What `resolveFieldPresentation()` builds a field's plan from: the decisions already taken about it */
export interface FieldPresentationInputs {
  /** The id of the field, which its control carries */
  id: string;
  /** Who draws each part, from `getPresentationDeclaration()` */
  declaration: ResolvedPresentationDeclaration;
  /** The label, from `getFieldLabel()` */
  label: string;
  /** Whether the `uiSchema` lets the field show its label, which `ui:label: false` turns off along with the
   * description. Defaults to true
   */
  showLabel?: boolean;
  description?: string;
  help?: string | ReactElement;
  /** The field's own error messages */
  errors?: readonly string[];
  /** Whether `ui:hideError` is in effect for the field */
  hideError?: boolean;
  /** Whether the control lists `examples` under `examplesId()` */
  hasExamples?: boolean;
  /** Whether the control renders its selected option's description under `selectedOptionDescriptionId()` */
  hasSelectedOptionDescription?: boolean;
  /** Whether a control is on screen for the label to name: false for an opted-out optional field or a hidden one, and
   * for a container, whose label is its own heading. Defaults to true
   */
  hasControl?: boolean;
  /** Whether the label shows the field as required */
  required?: boolean;
  /** Whether the control carries the native `required` attribute, when that differs from `required`: a checkbox the
   * schema lets be `false` is required to have a value, which unchecked it already does. Defaults to `required`
   */
  requiredAttribute?: boolean;
  /** The plan of the field above that renders this same id: the field whose selected `anyOf`/`oneOf` option this is,
   * or the fallback UI's field this is the value field of
   */
  inherited?: FieldPresentation;
}

/** Whether a part with this placement renders an element here */
function rendersHere(by: PartPlacement) {
  return by === 'template' || by === 'self';
}

/** Places a description or help: above when a field above rendering this id shows it, whether as the same text or as
 * the only text, so a level with none of its own carries the one above on to the levels beneath it; nowhere when it
 * has no text; and otherwise by its owner, under `ownId` unless a field above already shows its own under that id
 */
function placeText<Text>(
  text: Text | undefined,
  owner: ResolvedPresentationDeclaration['description'],
  ownId: string,
  optionId: string,
  inherited: (PartPresentation & { text?: Text }) | undefined,
): PartPresentation & { text?: Text } {
  if (!text) {
    return inherited && inherited.by !== 'none'
      ? { by: 'above', id: inherited.id, text: inherited.text }
      : { by: 'none', id: ownId };
  }
  if (inherited?.text === text) {
    return { by: inherited.by === 'none' ? 'none' : 'above', id: inherited.id };
  }
  return { by: owner, id: inherited && inherited.by !== 'none' ? optionId : ownId };
}

/** Builds a field's plan of what draws its label, description, help and errors, and the attributes its control
 * carries, from the declaration of who draws each part and the field's own text. It predicts nothing: whether a part
 * shows is decided from the decisions in `inputs`, so a template and a widget reading the plan agree on it.
 *
 * - The label shows where it has text and `showLabel` allows it. A label its template draws needs a control to name,
 *   and is `above` when the template of a field above rendering the same id already draws it; a label the widget
 *   draws stays, so a widget that names its own control keeps naming it.
 * - The description and help show where they have text, the description only where `showLabel` allows it. Text a field
 *   above already shows is `above`, as is a part with no text under a field above that shows one; text of its own takes
 *   `optionDescriptionId()` or `optionHelpId()` when that field shows its own text under the usual id.
 * - The errors are the field's own with `hideError` applied, or, under a field above, that field's, which it draws.
 * - The control is described by the parts that render, here or above, and is `aria-invalid` whenever errors show.
 *
 * @param inputs - The decisions the plan is built from
 * @returns - The field's plan
 */
export default function resolveFieldPresentation(inputs: FieldPresentationInputs): FieldPresentation {
  const {
    id,
    declaration,
    label: labelText,
    showLabel = true,
    description = '',
    help,
    errors = [],
    hideError = false,
    hasExamples = false,
    hasSelectedOptionDescription = false,
    hasControl = true,
    required = false,
    requiredAttribute = required,
    inherited,
  } = inputs;

  let labelBy: PartPlacement = declaration.label;
  if (declaration.label === 'template' && inherited && ['template', 'above'].includes(inherited.label.by)) {
    labelBy = 'above';
  } else if (!labelText || !showLabel || (declaration.label === 'template' && !hasControl)) {
    labelBy = 'none';
  }

  const descriptionPlacement = placeText(
    showLabel ? description : '',
    declaration.description,
    descriptionId(id),
    optionDescriptionId(id),
    inherited?.description,
  );
  const helpPlacement = placeText(help, declaration.help, helpId(id), optionHelpId(id), inherited?.help);

  let errorsPlan: FieldPresentation['errors'];
  if (inherited) {
    const { messages } = inherited.errors;
    errorsPlan = { messages, by: messages.length > 0 ? 'above' : 'none', id: inherited.errors.id };
  } else {
    const messages = hideError ? [] : errors;
    errorsPlan = { messages, by: messages.length > 0 ? declaration.errors : 'none', id: errorId(id) };
  }

  const describedBy = [
    ...new Set([
      ...(rendersHere(errorsPlan.by) ? [errorsPlan.id] : []),
      ...(inherited?.describedBy ?? []),
      ...(rendersHere(descriptionPlacement.by) ? [descriptionPlacement.id] : []),
      ...(rendersHere(helpPlacement.by) ? [helpPlacement.id] : []),
      ...(hasSelectedOptionDescription ? [selectedOptionDescriptionId(id)] : []),
      ...(hasExamples ? [examplesId(id)] : []),
    ]),
  ];

  let control: FieldPresentation['control'];
  if (hasControl) {
    const attributes: ControlAttributes = {};
    if ((labelBy === 'template' || labelBy === 'above') && declaration.labelledBy === 'aria-labelledby') {
      attributes['aria-labelledby'] = fieldLabelId(id);
    }
    if (describedBy.length > 0) {
      attributes['aria-describedby'] = describedBy.join(' ');
    }
    if (errorsPlan.messages.length > 0) {
      attributes['aria-invalid'] = true;
    }
    if (requiredAttribute) {
      attributes.required = true;
    }
    control = { id, attributes, requiredMarker: required };
  }

  return {
    label: { text: labelText, by: labelBy, id: fieldLabelId(id) },
    description: { text: description, ...descriptionPlacement },
    help: { text: help, ...helpPlacement },
    errors: errorsPlan,
    describedBy,
    control,
  };
}
