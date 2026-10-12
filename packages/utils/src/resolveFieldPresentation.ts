import type { ReactElement } from 'react';

import { descriptionId, errorId, fieldLabelId, helpId, optionDescriptionId, optionHelpId } from './idGenerators.ts';
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
  /** The ids of the elements the control renders to describe itself, such as its `selectedOptionDescriptionId()` or
   * its `examplesId()` list, which describe it after the field's parts. They describe this control alone, so they go
   * in its `aria-describedby` but not in the plan's `describedBy`, which a field below rendering the same id inherits
   */
  controlDescribedBy?: readonly string[];
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
   * or the fallback UI's field this is the value field of. A selector, whose id is its own, takes the plan of the field
   * it picks the option of
   */
  inherited?: FieldPresentation;
}

const NONE: readonly string[] = Object.freeze([]);

/** Drops the empty ids and the repeats from `ids`, keeping the first of each */
function uniqueIds(ids: readonly string[]) {
  return [...new Set(ids)].filter(Boolean);
}

/** Whether a part with this placement renders an element here */
function rendersHere(by: PartPlacement) {
  return by === 'template' || by === 'self';
}

/** Places a description or help: above when a field above rendering this id shows it, whether as the same text or,
 * for the nearest of them that shows text, as the only text, so a level with none of its own carries the one above on
 * to the levels beneath it; nowhere when it has no text, or when a field above hides the same text; and otherwise by
 * its owner, under `ownId` unless a field above already shows text under that id, in which case it takes the option id
 * numbered by how many of them show text of their own
 *
 * @param above - The part in the plans of the fields above rendering this id, nearest first
 */
function placeText<Text>(
  text: Text | undefined,
  owner: ResolvedPresentationDeclaration['description'],
  ownId: string,
  optionId: (depth: number) => string,
  above: readonly (PartPresentation & { text?: Text })[],
): PartPresentation & { text?: Text } {
  if (!text) {
    const nearest = above.find((part) => part.by !== 'none');
    return nearest ? { by: 'above', id: nearest.id, text: nearest.text } : { by: 'none', id: ownId };
  }
  const shown = above.find((part) => part.text === text);
  if (shown) {
    return { by: shown.by === 'none' ? 'none' : 'above', id: shown.id };
  }
  const shownAbove = above.filter((part) => rendersHere(part.by)).length;
  return { by: owner, id: shownAbove > 0 ? optionId(shownAbove) : ownId };
}

/** Builds a field's plan of what draws its label, description, help and errors, and the attributes its control
 * carries, from the declaration of who draws each part and the field's own text. It predicts nothing: whether a part
 * shows is decided from the decisions in `inputs`, so a template and a widget reading the plan agree on it.
 *
 * - The label shows where it has text and `showLabel` allows it. A label its template draws needs a control to name.
 *   It is `above`, under the id of the label drawn there, when the template of a field above rendering the same id
 *   already draws it, whoever would draw it here, so a widget that draws its own label doesn't name the control a
 *   second time. A level with no control, such as a container whose label is its own heading, keeps its label only
 *   when no field above already draws its text, or else is `above` under the id of the label that does. The control
 *   points `aria-labelledby` at a label its template draws, or one above, when its declaration says so, when the
 *   control above was pointed at that label too, since its template may then draw it with no `for`, or when its id
 *   isn't the one that label's `for` names, such as a selector's.
 * - The description and help show where they have text, the description only where `showLabel` allows it. Text any
 *   field above already shows is `above`, as is a part with no text under a field above that shows one, and text a
 *   field above hides stays hidden; text of its own takes `optionDescriptionId()` or `optionHelpId()` when a field
 *   above shows text under the usual id, numbered by how many fields above show text of their own, so each level's own
 *   text has an id of its own.
 * - The errors are the field's own with `hideError` applied, or, under a field above, that field's, which it draws.
 * - The control is described by the parts that render, here or above, then by its own `controlDescribedBy`, and is
 *   `aria-invalid` whenever errors show.
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
    errors = NONE,
    hideError = false,
    controlDescribedBy = NONE,
    hasControl = true,
    required = false,
    requiredAttribute = required,
    inherited,
  } = inputs;

  const plansAbove: FieldPresentation[] = [];
  for (let plan = inherited; plan; plan = plan.inherited) {
    plansAbove.push(plan);
  }

  // A template label above names a control; with none here, only a heading that says something no label above says
  // stays
  const labelAbove =
    hasControl || declaration.label === 'template'
      ? plansAbove.find((plan) => plan.label.by === 'template')
      : plansAbove.find((plan) => rendersHere(plan.label.by) && plan.label.text === labelText);
  const labelId = labelAbove?.label.id ?? fieldLabelId(id);
  let labelBy: PartPlacement = declaration.label;
  if (labelAbove) {
    labelBy = 'above';
  } else if (!labelText || !showLabel || (declaration.label === 'template' && !hasControl)) {
    labelBy = 'none';
  }

  const descriptionPlacement = placeText(
    showLabel ? description : '',
    declaration.description,
    descriptionId(id),
    (depth) => optionDescriptionId(id, depth),
    plansAbove.map((plan) => plan.description),
  );
  const helpPlacement = placeText(
    help,
    declaration.help,
    helpId(id),
    (depth) => optionHelpId(id, depth),
    plansAbove.map((plan) => plan.help),
  );

  const { messages, id: errorsId } = inherited?.errors ?? { messages: hideError ? NONE : errors, id: errorId(id) };
  const errorsBy = inherited ? 'above' : declaration.errors;
  const errorsPlan: FieldPresentation['errors'] = {
    messages,
    by: messages.length > 0 ? errorsBy : 'none',
    id: errorsId,
  };

  const describedBy = uniqueIds([
    rendersHere(errorsPlan.by) ? errorsId : '',
    ...(inherited?.describedBy ?? NONE),
    rendersHere(descriptionPlacement.by) ? descriptionPlacement.id : '',
    rendersHere(helpPlacement.by) ? helpPlacement.id : '',
  ]);

  let control: FieldPresentation['control'];
  if (hasControl) {
    const attributes: ControlAttributes = {};
    // The label above was drawn for the control of its own plan: with no `for` when that control was pointed at it
    // instead, and naming another element when the ids differ
    const forMissesControl =
      labelAbove !== undefined &&
      (labelAbove.control?.id !== id || labelAbove.control.attributes['aria-labelledby'] !== undefined);
    if (
      (labelBy === 'template' || labelBy === 'above') &&
      (declaration.labelledBy === 'aria-labelledby' || forMissesControl)
    ) {
      attributes['aria-labelledby'] = labelId;
    }
    const controlDescribers = uniqueIds([...describedBy, ...controlDescribedBy]);
    if (controlDescribers.length > 0) {
      attributes['aria-describedby'] = controlDescribers.join(' ');
    }
    if (messages.length > 0) {
      attributes['aria-invalid'] = true;
    }
    if (requiredAttribute) {
      attributes.required = true;
    }
    control = { id, attributes, requiredMarker: required };
  }

  return {
    label: { text: labelText, by: labelBy, id: labelId },
    description: { text: description, ...descriptionPlacement },
    help: { text: help, ...helpPlacement },
    errors: errorsPlan,
    describedBy,
    control,
    inherited,
  };
}
