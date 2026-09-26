import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';

import type { DaisyProps } from './types/DaisyProps.ts';

export type DaisyUiSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = UiSchema<T, S, F> & {
  'ui:options'?: DaisyUiOptions<T, S, F>;
};

type DaisyUiOptions<T, S extends StrictRJSFSchema, F extends FormContextType> = UiSchema<T, S, F>['ui:options'] & {
  daisy?: DaisyProps;
};

interface GetDaisyProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  uiSchema?: DaisyUiSchema<T, S, F>;
}

export function getDaisy<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ uiSchema }: GetDaisyProps<T, S, F>): DaisyProps {
  return uiSchema?.['ui:options']?.daisy || {};
}

interface GroupProps {
  id: string;
  role: 'group' | 'radiogroup';
  'aria-labelledby'?: string;
  'aria-label'?: string;
}

interface GetGroupProps {
  id: string;
  label?: string;
  hideLabel?: boolean;
  role: GroupProps['role'];
}

/** Return the `id` of the label `FieldTemplate` renders above a field's control, for a widget that has to name itself
 * from it. It cannot be `titleId()`, which `TitleFieldTemplate` already claims for the same field, so an
 * `additionalProperties` object would carry that id twice.
 *
 * Two labels still end up with this id wherever two `FieldTemplate`s render for one field id, which already gives that
 * control two `<label htmlFor>` of its own: a `oneOf` of constants, whose selected option renders again inside the
 * field, and a layout that places the same field twice. A reference resolves to the first, which is the field's own
 * label rather than the option's.
 *
 * @param id - The id of the field
 * @returns - The id of that field's label element
 */
export function fieldLabelId(id: string) {
  return `${id}__label`;
}

/** Return the `id` of the element inside a picker's trigger that displays the selected value, which the trigger
 * references to keep that value in its accessible name. The trigger cannot reference itself for this: it is a
 * `<button>`, which the `FieldTemplate` label already names through `htmlFor`, and a self-reference inside
 * `aria-labelledby` is dropped rather than resolved back to the element's own contents.
 *
 * @param id - The id of the trigger
 * @returns - The id of the element displaying its value
 */
export function triggerValueId(id: string) {
  return `${id}__value`;
}

/** Builds the props that name a widget rendering several controls, since no single control in a group can carry the
 * label `FieldTemplate` renders above it and a `label htmlFor` does not associate with the group's wrapper. The group
 * points at the label element rather than repeating its text, so its accessible name is whatever the label displays:
 * the `label` a widget is handed is computed separately from the one the template renders, and differs from it for an
 * `additionalProperties` entry, whose template label is the key, and under `deprecatedHandling: 'label'`, which
 * decorates only the template's.
 *
 * The reference is claimed only when this widget has a label to be named by, so it is dropped for a field with no
 * title, where the template renders no label to point at. A field whose `title` is explicitly `''` is the one case
 * where the two disagree in the other direction: the template falls back to the property name and renders a label,
 * while the widget's `label` is empty, so the group goes unnamed rather than pointing at an element that is there.
 *
 * @param id - The widget's `id`, which the label's `htmlFor` targets and `fieldLabelId()` derives the label's id from
 * @param label - The field's label, empty when it has no title
 * @param hideLabel - Whether the label is hidden, in which case the template renders none
 * @param role - The group role for the controls, `radiogroup` for radios and `group` for anything else
 * @returns - The `id`, `role` and, when there is a label to point at, `aria-labelledby` props for the group's wrapper
 */
export function getGroupProps({ id, label, hideLabel, role }: GetGroupProps): GroupProps {
  if (hideLabel || !label) {
    return { id, role };
  }
  // Both, because the widget cannot see whether the template rendered a label to point at. `aria-labelledby` wins
  // wherever it resolves, so the name stays the visible text; `aria-label` is what names the group wherever the two
  // conditions disagree — a `boolean` whose widget is set through `ui:options.widget` rather than `ui:widget`, where
  // `getDisplayLabel()` suppresses the template's label but `BooleanField` still reports `hideLabel: false`, and an
  // optional field rendered without one. The fallback is lossy: the `label` a widget is handed is not always the text
  // the template would have rendered, so in those cases the group is named something that is not on the screen. That
  // first case is `getDisplayLabel()` reading only the `ui:widget` spelling, which `SchemaField` carries its own
  // workaround for; the fallback is worth dropping once that reads the reduced ui options instead
  return { id, role, 'aria-labelledby': fieldLabelId(id), 'aria-label': label };
}

interface GetTriggerLabelledBy {
  id: string;
  label?: string;
  hideLabel?: boolean;
  hasValue: boolean;
}

/** Names the trigger of a picker whose own contents carry the selected value. The trigger points at the label element
 * `FieldTemplate` renders *and* at itself, so the value stays part of the name; with no value those contents are the
 * label, which would otherwise read out twice, so only the label element is referenced. Where the label is hidden or
 * the field has no title the template renders no label element to point at, and the trigger's contents are the whole
 * name.
 *
 * @param id - The trigger's `id`, which `fieldLabelId()` and `triggerValueId()` derive the two ids from
 * @param label - The field's label, empty when it has no title
 * @param hideLabel - Whether the label is hidden, in which case the template renders none
 * @param hasValue - Whether the trigger is displaying a value rather than falling back to the label
 * @returns - The `aria-labelledby` for the trigger, or `undefined` where its own contents are the whole name
 */
export function getTriggerLabelledBy({ id, label, hideLabel, hasValue }: GetTriggerLabelledBy): string | undefined {
  if (hideLabel || !label) {
    return undefined;
  }
  return hasValue ? `${fieldLabelId(id)} ${triggerValueId(id)}` : fieldLabelId(id);
}
