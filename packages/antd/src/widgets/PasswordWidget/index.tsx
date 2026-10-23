import type { ChangeEvent, FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes } from '@rjsf/utils';
import { Input } from 'antd';

import getControlState from '../../controlState.ts';

/** The `PasswordWidget` component uses the `BaseInputTemplate` changing the type to `password`.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function PasswordWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    autofocus,
    disabled,
    registry,
    id,
    htmlName,
    onBlur,
    onChange,
    onFocus,
    options,
    placeholder,
    readonly,
    required,
    value,
    presentation,
  } = props;
  const control = getControlState<T, S, F>({ disabled, readonly, registry });

  const emptyValue = options.emptyValue || '';

  const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) =>
    onChange(target.value === '' ? emptyValue : target.value);

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target.value);

  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target.value);

  return (
    <Input.Password
      autoFocus={autofocus}
      disabled={control.disabled}
      id={id}
      name={htmlName || id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      readOnly={readonly}
      required={required}
      value={value || ''}
      {...getControlAttributes<T, S, F>({ id, presentation })}
    />
  );
}
