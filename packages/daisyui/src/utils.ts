import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import { ariaDescribedByIds, fieldLabelId, triggerValueId } from '@rjsf/utils';

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
}

interface GetGroupProps {
  id: string;
  label?: string;
  name?: string;
  hideLabel?: boolean;
  role: GroupProps['role'];
}

/** Whether this field has a label for a widget to reference. One predicate behind both of the helpers below, so they
 * cannot drift apart and disagree about whether the element they point at exists.
 *
 * The property name is the fallback because that is the one the template's own label falls back to: `SchemaField`
 * computes it with `||`, so a field whose `title` is explicitly `''` still gets a label there, while the `label` a
 * widget is handed keeps the `''` it was given.
 *
 * It answers from what the widget was handed, which is as close as a widget can get: it cannot see the label the
 * template computed, and the two disagree in one case either way. Under `deprecatedHandling: 'label'` a field with
 * neither a title nor a property name — a root field, an array item — is given a template label that is nothing but
 * the deprecation decoration, so one is rendered where this says none is; pointing a group at it would name the group
 * `(deprecated)`, which is why the widget is left to its own name instead. In the other direction, a `oneOf` option
 * selector is handed the field's title while the label that title renders names the field's own control rather than
 * the selector, so the value it displays is described as well as shown.
 *
 * @param label - The field's label, empty when it has no title
 * @param name - The field's property name, which the template's label falls back to
 * @param hideLabel - Whether the label is hidden, in which case the template renders none
 * @returns - True if there is a label for `fieldLabelId()` to point at
 */
function hasLabelToReference({ label, name, hideLabel }: { label?: string; name?: string; hideLabel?: boolean }) {
  return !hideLabel && !!(label || name);
}

/** Builds the props that name a widget rendering several controls, since no single control in a group can carry the
 * label `FieldTemplate` renders above it and a `label htmlFor` does not associate with the group's wrapper. The group
 * points at the label element rather than repeating its text, so its accessible name is whatever the label displays:
 * the `label` a widget is handed is computed separately from the one the template renders, and differs from it for an
 * `additionalProperties` entry, whose template label is the key, and under `deprecatedHandling: 'label'`, which
 * decorates only the template's.
 *
 * The reference is claimed only when this widget has a label to be named by, so it is dropped for a field with
 * neither a title nor a property name — a root field — where the template renders no label to point at.
 *
 * A reference is all a group has: nothing outside a `FieldTemplate` rendering `fieldLabelId()` can name it, so a
 * replacement one that renders no such label leaves these widgets unnamed. That is what the id is exported for.
 *
 * @param id - The widget's `id`, which the label's `htmlFor` targets and `fieldLabelId()` derives the label's id from
 * @param label - The field's label, empty when it has no title
 * @param name - The field's property name, which the template's label falls back to
 * @param hideLabel - Whether the label is hidden, in which case the template renders none
 * @param role - The group role for the controls, `radiogroup` for radios and `group` for anything else
 * @returns - The `id`, `role` and, when there is a label to point at, `aria-labelledby` props for the group's wrapper
 */
export function getGroupProps({ id, label, name, hideLabel, role }: GetGroupProps): GroupProps {
  if (!hasLabelToReference({ label, name, hideLabel })) {
    return { id, role };
  }
  return { id, role, 'aria-labelledby': fieldLabelId(id) };
}

interface GetTriggerDescribedBy {
  id: string;
  label?: string;
  name?: string;
  hideLabel?: boolean;
  hasValue: boolean;
}

/** Builds the `aria-describedby` for a button that displays the field's value and opens a popup to change it — a
 * picker's trigger, and the select's dropdown — which is how the value it displays is announced. The label
 * `FieldTemplate` renders names the button through its own `htmlFor`, and a name from outside an element replaces its
 * contents, so the value would otherwise be dropped from everything a screen reader says about the control — the same
 * split a native control makes between its name and its value.
 *
 * Where the predicate below reports no label to name the button, its contents *are* its name, and referencing them as
 * well would have the value announced twice.
 *
 * A single control is named by that `htmlFor` alone, so this describes the value rather than pointing
 * `aria-labelledby` at the label and the value together: a reference would outrank the association, and under a
 * `FieldTemplate` that renders no label carrying `fieldLabelId()` it would leave the button named by its own value
 * with the field's label dropped.
 *
 * @param id - The button's `id`, which `triggerValueId()` and `ariaDescribedByIds()` derive their ids from
 * @param label - The field's label, empty when it has no title
 * @param name - The field's property name, which the template's label falls back to
 * @param hideLabel - Whether the label is hidden, in which case the template renders none
 * @param hasValue - Whether the button is displaying a value rather than falling back to the label
 * @returns - The button's `aria-describedby`, naming the value element only where the label names the button
 */
export function getTriggerDescribedBy({ id, label, name, hideLabel, hasValue }: GetTriggerDescribedBy) {
  if (!hasValue || !hasLabelToReference({ label, name, hideLabel })) {
    return ariaDescribedByIds(id);
  }
  return `${triggerValueId(id)} ${ariaDescribedByIds(id)}`;
}
