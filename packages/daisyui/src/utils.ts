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

/** Builds the `aria-describedby` for a picker's trigger, which is how the value it displays is announced. The label
 * `FieldTemplate` renders names the trigger through its own `htmlFor`, and a name from outside an element replaces its
 * contents, so the value would otherwise be dropped from everything a screen reader says about the control — the same
 * split a native control makes between its name and its value.
 *
 * Where there is no label to name the trigger, its contents *are* its name, and referencing them as well would have
 * the value announced twice.
 *
 * @param id - The trigger's `id`, which `triggerValueId()` and `ariaDescribedByIds()` derive their ids from
 * @param label - The field's label, empty when it has no title
 * @param name - The field's property name, which the template's label falls back to
 * @param hideLabel - Whether the label is hidden, in which case the template renders none
 * @param hasValue - Whether the trigger is displaying a value rather than falling back to the label
 * @returns - The trigger's `aria-describedby`, naming the value element only where the label names the trigger
 */
export function getTriggerDescribedBy({ id, label, name, hideLabel, hasValue }: GetTriggerDescribedBy) {
  if (!hasValue || !hasLabelToReference({ label, name, hideLabel })) {
    return ariaDescribedByIds(id);
  }
  return `${triggerValueId(id)} ${ariaDescribedByIds(id)}`;
}
