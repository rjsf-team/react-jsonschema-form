import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import { titleId } from '@rjsf/utils';

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

/** Builds the props that let a widget rendering several controls be named by the label `FieldTemplate` renders above
 * it, since no single control in a group can carry that label. The `aria-labelledby` is only claimed when the template
 * actually renders the label, under the same `!hideLabel && !!label` condition, so it can never point at a missing id.
 *
 * @param id - The widget's `id`, which the label's `htmlFor` targets and `titleId()` derives the label's id from
 * @param label - The field's label, empty when it has no title
 * @param hideLabel - Whether the label is hidden, in which case the template renders none
 * @param role - The group role for the controls, `radiogroup` for radios and `group` for anything else
 * @returns - The `id`, `role` and, when the label is rendered, `aria-labelledby` props for the group's wrapper
 */
export function getGroupProps({ id, label, hideLabel, role }: GetGroupProps): GroupProps {
  return { id, role, 'aria-labelledby': !hideLabel && label ? titleId(id) : undefined };
}
