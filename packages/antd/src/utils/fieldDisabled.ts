import type { FormContextType, GenericObjectType } from '@rjsf/utils';

/** Computes the `disabled` prop for an antd control as `true | undefined`, never `false`: antd merges the prop
 * with its `DisabledContext` as `customDisabled ?? disabled`, so an explicit `false` would keep the control
 * enabled under a disabled context, while `undefined` lets the context decide. A `readonly` control counts as
 * disabled unless the form sets `formContext.readonlyAsDisabled: false`.
 */
export default function fieldDisabled<F extends FormContextType = FormContextType>(
  disabled?: boolean,
  readonly?: boolean,
  formContext?: F,
): true | undefined {
  const readonlyAsDisabled = (formContext as GenericObjectType | undefined)?.readonlyAsDisabled !== false;
  return (disabled || (readonlyAsDisabled && readonly)) === true ? true : undefined;
}
