import { ChangeEvent, FocusEvent } from 'react';
import Input from 'antd/lib/input';
import {
  ariaDescribedByIds,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  GenericObjectType,
} from '@rjsf/utils';

/** The `PasswordWidget` component uses the `BaseInputTemplate` changing the type to `password`.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function PasswordWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const { disabled, formContext, id, onBlur, onChange, onFocus, options, placeholder, readonly, value } = props;
  const { readonlyAsDisabled = true } = formContext as GenericObjectType;

  const emptyValue = options.emptyValue || '';

  const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) =>
    onChange(target.value === '' ? emptyValue : target.value);

  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target.value);

  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target.value);

  return (
    <Input.Password
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      value={value || ''}
      aria-describedby={ariaDescribedByIds<T>(id)}
    />
  );
}
