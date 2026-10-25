import type { ReactElement } from 'react';

import getDescribedControlAttributes from './getDescribedControlAttributes.ts';
import {
  descriptionId,
  errorId,
  fieldLabelId,
  helpId,
  optionDescriptionId,
  optionHelpId,
  optionLabelId,
  titleId,
} from './idGenerators.ts';
import type {
  ControlAttributes,
  FieldPresentation,
  PartPlacement,
  PartPresentation,
  ResolvedPresentationDeclaration,
} from './types.ts';
import uniqueIds from './uniqueIds.ts';

/** What `resolveFieldPresentation()` builds a field's plan from: the decisions already taken about it */
export interface FieldPresentationInputs {
  /** The id of the field, which its control carries */
  id: string;
  /** Who draws each part, from `getPresentationDeclaration()` */
  declaration: ResolvedPresentationDeclaration;
  /** The label, from `getFieldLabel()` */
  label: string;
  /** Whether the `uiSchema` lets the field show its label, which `ui:label: false` turns off along with the
   * description. It is the resolved value, which the caller passes down: the field's own `ui:label`, else the one the
   * field above rendering this same id resolved to, since an option's `uiSchema` given per option doesn't carry the
   * field's. It is the only way a level is hidden: a description a field above hides doesn't hide the same text here.
   * Defaults to true
   */
  showLabel?: boolean;
  description?: string;
  help?: string | ReactElement;
  /** The field's own error messages */
  errors?: readonly string[];
  /** Whether `ui:hideError` is in effect for the field */
  hideError?: boolean;
  /** Whether a control is on screen for the label to name: false for an opted-out optional field or a hidden one, and
   * for a container, whose label is its own heading. Defaults to true
   */
  hasControl?: boolean;
  /** Whether the field is required, which its label's marker and its control's native attribute both show.
   * `@rjsf/core` plans a checkbox the schema lets be `false` as not required, since unchecked it already has the value
   * it is required to have (#5388)
   */
  required?: boolean;
  /** The plan of the field above that renders this same id: the field whose selected `anyOf`/`oneOf` option this is,
   * or the fallback UI's field this is the value field of. A selector, whose id is its own, isn't planned here but by
   * `getSelectorPresentation()`, from the plan of the field it picks the option of
   */
  inherited?: FieldPresentation;
  /** The id the field's own component renders under, when it differs from `id`: a field rendered beside its
   * `anyOf`/`oneOf` options, whose selected option renders `id`. A part the component draws itself takes its id from
   * this one, so it renders under an id of its own, and a part the template draws from `id`. Defaults to `id`
   */
  componentId?: string;
}

const NONE: readonly string[] = Object.freeze([]);

/** Whether a part with this placement renders an element here */
function rendersHere(by: PartPlacement) {
  return by === 'template' || by === 'self';
}

/** The id a part of this level's own takes: `ownId`, or, when a field above already renders that part under it, the
 * option id numbered by how many fields above render one, so each level's own part has an id of its own
 *
 * @param ownId - The id the part takes with no field above rendering it
 * @param optionId - The option id for a depth
 * @param above - The part in the plans of the fields above rendering this id, nearest first
 */
function ownPartId(ownId: string, optionId: (depth: number) => string, above: readonly PartPresentation[]) {
  const rendered = above.filter((part) => rendersHere(part.by));
  return rendered.some((part) => part.id === ownId) ? optionId(rendered.length) : ownId;
}

/** Places a description or help:
 *
 * - With no text, `above` under the nearest field above that shows one, which it carries on to the levels beneath it,
 *   or else nowhere.
 * - With the text a field above shows, `above`. Text is compared with `===`, so an element `ui:help` matches only the
 *   same element: an option inheriting its field's `uiSchema` carries it, but the same JSX written out again is another
 *   element, which no comparison of elements could tell apart reliably
 * - Otherwise by its owner, which is `none` when it is hidden here, under the id `ownPartId()` gives it, so even a
 *   hidden part's id names no element drawn above.
 *
 * @param owner - What draws the part here, or `none` when it is hidden here
 * @param above - The part in the plans of the fields above rendering this id, nearest first
 */
function placeText<Text>(
  text: Text | undefined,
  owner: ResolvedPresentationDeclaration['description'] | 'none',
  ownId: string,
  optionId: (depth: number) => string,
  above: readonly (PartPresentation & { text?: Text })[],
): PartPresentation & { text?: Text } {
  if (!text) {
    const nearest = above.find((part) => part.by !== 'none');
    return nearest ? { by: 'above', id: nearest.id, text: nearest.text } : { by: 'none', id: ownId };
  }
  const shown = above.find((part) => part.by !== 'none' && part.text === text);
  if (shown) {
    return { by: 'above', id: shown.id };
  }
  return { by: owner, id: ownPartId(ownId, optionId, above) };
}

/** Builds a field's plan of what draws its label, description, help and errors, and the attributes its control
 * carries, from the declaration of who draws each part and the field's own text. It predicts nothing: whether a part
 * shows is decided from the decisions in `inputs`, so a template and a widget reading the plan agree on it.
 *
 * - The label shows where it has text and `showLabel` allows it. A label its template draws needs a control to name.
 *   It is `above`, under the id and text of the label drawn there, when the template of a field above rendering the
 *   same id already draws it, whoever would draw it here, so a widget that draws its own label doesn't name the control
 *   a second time. A level with no control, such as a container whose label is its own heading, keeps its label only
 *   when no field above already draws its text, or else is `above` under the id of the label that does. A label of its
 *   own with a control to name takes `optionLabelId()` when a field above draws a label under the id it would take,
 *   numbered by how many fields above draw one. The control points `aria-labelledby` at a label its template draws, or
 *   one above, when its declaration says so, when the control above was pointed at that label too, since its template
 *   may then draw it with no `for`, or when its id isn't the one that label's `for` names. Its `requiredMarker` follows
 *   `required` whether or not there is a control, so a container's heading is marked too, and an `above` label carries
 *   the marker of the label drawn above, so the plan describes that one label as it is drawn; the control's own
 *   `required` stays this level's. A control whose label `showLabel` hides is named by the label's text through
 *   `aria-label`, since hiding the label is a choice of layout, not of the control's name, or by the text of the
 *   nearest field above rendering the same id whose label is hidden too, as an option's control is named by its
 *   field's label while it shows.
 * - The description and help show where they have text, the description only where `showLabel` allows it. Text any
 *   field above already shows is `above`, as is a part with no text under a field above that shows one; text of its
 *   own takes `optionDescriptionId()` or `optionHelpId()` when a field above shows text under the id it would take,
 *   numbered by how many fields above show text of their own, so each level's own text has an id of its own.
 * - The errors are the field's own with `hideError` applied, or, under a field above, that field's, which it draws.
 * - A part the field's own component draws takes its ids from `componentId`, the id that component renders under beside
 *   the field's `anyOf`/`oneOf` options, and a part the template draws from `id`.
 * - The control is described by the parts that render, here or above, and is `aria-invalid` whenever errors show.
 * - `showLabel` is recorded as resolved, for the levels and widgets beneath to read.
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
    hasControl = true,
    required = false,
    inherited,
    componentId = id,
  } = inputs;
  /** The id a part's ids derive from: the component's own for a part it draws itself, the field's otherwise */
  const ownerId = (owner: PartPlacement) => (owner === 'self' ? componentId : id);

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
  // A level with a control is named by a label; one with none, such as a container, draws its label as the heading every
  // title template renders under `titleId()`, whatever the plan says. A label a field above draws, such as the one an
  // `anyOf` field's selector draws itself, may already take a control's id
  const ownLabelId = (hasControl ? fieldLabelId : titleId)(ownerId(declaration.label));
  const {
    text: shownLabel,
    id: labelId,
    requiredMarker,
  } = labelAbove?.label ?? {
    text: labelText,
    id: hasControl
      ? ownPartId(
          ownLabelId,
          (depth) => optionLabelId(ownerId(declaration.label), depth),
          plansAbove.map((plan) => plan.label),
        )
      : ownLabelId,
    requiredMarker: required,
  };
  let labelBy: PartPlacement = declaration.label;
  if (labelAbove) {
    labelBy = 'above';
  } else if (!labelText || !showLabel || (declaration.label === 'template' && !hasControl)) {
    labelBy = 'none';
  }

  const descriptionPlacement = placeText(
    description,
    showLabel ? declaration.description : 'none',
    descriptionId(ownerId(declaration.description)),
    (depth) => optionDescriptionId(ownerId(declaration.description), depth),
    plansAbove.map((plan) => plan.description),
  );
  const helpPlacement = placeText(
    help,
    declaration.help,
    helpId(ownerId(declaration.help)),
    (depth) => optionHelpId(ownerId(declaration.help), depth),
    plansAbove.map((plan) => plan.help),
  );

  const { messages, id: errorsId } = inherited?.errors ?? {
    messages: hideError ? NONE : errors,
    id: errorId(ownerId(declaration.errors)),
  };
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
    const attributes: ControlAttributes = getDescribedControlAttributes(describedBy, messages);
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
    // Named as the label above would name it were it shown, so a field above rendering this id names it by its text
    if (!showLabel && !labelAbove) {
      const hiddenLabel = plansAbove.map((plan) => plan.control?.attributes['aria-label']).find(Boolean) ?? labelText;
      if (hiddenLabel) {
        attributes['aria-label'] = hiddenLabel;
      }
    }
    if (required) {
      attributes.required = true;
    }
    control = { id, attributes };
  }

  return {
    label: { text: shownLabel, by: labelBy, id: labelId, requiredMarker },
    description: { text: description, ...descriptionPlacement },
    help: { text: help, ...helpPlacement },
    errors: errorsPlan,
    describedBy,
    showLabel,
    control,
    inherited,
  };
}
