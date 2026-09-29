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
  'aria-label'?: string;
}

interface GetGroupProps {
  id: string;
  label?: string;
  hideLabel?: boolean;
  role: GroupProps['role'];
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
  // wherever it resolves, so wherever there is a label on the screen the name is its text and the `aria-label` is
  // dead; the `aria-label` is therefore only ever read where nothing visible names the group, which is a `boolean`
  // whose widget is set through `ui:options.widget` rather than `ui:widget`, where `getDisplayLabel()` suppresses the
  // template's label while `BooleanField` still reports `hideLabel: false`. Being unable to contradict text that is on
  // the screen is what makes the fallback safe rather than a second name; it is worth dropping once `getDisplayLabel()`
  // reads the reduced ui options instead of only the `ui:widget` spelling, which `SchemaField` also works around
  return { id, role, 'aria-labelledby': fieldLabelId(id), 'aria-label': label };
}

interface GetTriggerDescribedBy {
  id: string;
  label?: string;
  hideLabel?: boolean;
  hasValue: boolean;
}

/** Builds the `aria-describedby` for a picker's trigger, which is how the value it displays is announced. The label
 * `FieldTemplate` renders names the trigger through its own `htmlFor`, and a name from outside an element replaces its
 * contents, so the value would otherwise be dropped from everything a screen reader says about the control — the same
 * split a native control makes between its name and its value.
 *
 * Where there is no label to name the trigger, its contents *are* its name, and referencing them as well would have
 * the value announced twice. That is the same condition `getGroupProps()` uses, so the two stay in step.
 *
 * @param id - The trigger's `id`, which `triggerValueId()` and `ariaDescribedByIds()` derive their ids from
 * @param label - The field's label, empty when it has no title
 * @param hideLabel - Whether the label is hidden, in which case the template renders none
 * @param hasValue - Whether the trigger is displaying a value rather than falling back to the label
 * @returns - The trigger's `aria-describedby`, naming the value element only where the label names the trigger
 */
export function getTriggerDescribedBy({ id, label, hideLabel, hasValue }: GetTriggerDescribedBy) {
  if (!hasValue || hideLabel || !label) {
    return ariaDescribedByIds(id);
  }
  return `${triggerValueId(id)} ${ariaDescribedByIds(id)}`;
}
