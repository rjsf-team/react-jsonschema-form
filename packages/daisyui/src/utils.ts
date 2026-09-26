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
  return { id, role, 'aria-labelledby': !hideLabel && label ? fieldLabelId(id) : undefined };
}
