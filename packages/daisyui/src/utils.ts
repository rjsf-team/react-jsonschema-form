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
  'aria-label'?: string;
}

interface GetGroupProps {
  id: string;
  label?: string;
  hideLabel?: boolean;
  role: GroupProps['role'];
}

/** Builds the props that name a widget rendering several controls, since no single control in a group can carry the
 * label `FieldTemplate` renders above it and a `label htmlFor` does not associate with the group's wrapper. The name
 * is the label's own text rather than a reference to that element: the label cannot be identified by `titleId()`,
 * which `TitleFieldTemplate` already claims for the same field, and a reference is one more thing that can point at
 * nothing. It is only claimed when the template renders a label, under that same `!hideLabel && !!label` condition.
 *
 * @param id - The widget's `id`, which the label's `htmlFor` targets
 * @param label - The field's label, empty when it has no title
 * @param hideLabel - Whether the label is hidden, in which case the template renders none
 * @param role - The group role for the controls, `radiogroup` for radios and `group` for anything else
 * @returns - The `id`, `role` and, when the label is rendered, `aria-label` props for the group's wrapper
 */
export function getGroupProps({ id, label, hideLabel, role }: GetGroupProps): GroupProps {
  return { id, role, 'aria-label': !hideLabel && label ? label : undefined };
}
