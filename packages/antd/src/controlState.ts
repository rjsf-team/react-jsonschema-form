import type { FormContextType, Registry, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { ConfigProvider } from 'antd';

import type { AntdFormContext } from './formContext.ts';

/** The state an antd control takes from its field, worked out once for every widget and template */
export interface ControlState {
  /** `true` for a field that is disabled, read-only under `readonlyAsDisabled`, or rendered under a `<ConfigProvider
   * componentDisabled>`, so a control that doesn't read antd's context, such as a hidden input, is disabled with the
   * ones that do. `undefined` rather than `false` otherwise, since antd reads its `DisabledContext` only when a control
   * leaves `disabled` unset
   */
  disabled: true | undefined;
  /** For a control with no read-only state of its own, such as a checkbox or a radio: `true` for a required field that
   * isn't read-only. A read-only one the form leaves enabled takes no `required`, which would have the browser block
   * the submit of a field its user can't answer
   */
  toggleRequired: true | undefined;
  /** `true` for a read-only field the form leaves enabled, for a control with no native read-only state to announce,
   * such as a radio group, a checkbox or antd's select
   */
  ariaReadonly: true | undefined;
}

/** Works out the state an antd control takes from its field's `disabled`, `readonly` and `required`, the form's
 * `readonlyAsDisabled` and the `componentDisabled` of the `ConfigProvider` it renders under, so that every widget and
 * template agrees on it
 *
 * @param props - The field's `disabled`, `readonly`, `required` and `registry`
 * @returns - The control's `ControlState`
 */
export default function useControlState<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  disabled,
  readonly,
  required,
  registry,
}: {
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  registry: Registry<T, S, F>;
}): ControlState {
  const { readonlyAsDisabled = true }: AntdFormContext = registry.formContext;
  const { componentDisabled } = ConfigProvider.useConfig();
  const fieldDisabled = disabled || (readonlyAsDisabled && readonly) || componentDisabled;
  return {
    disabled: fieldDisabled || undefined,
    toggleRequired: (required && !readonly) || undefined,
    ariaReadonly: (readonly && !fieldDisabled) || undefined,
  };
}
