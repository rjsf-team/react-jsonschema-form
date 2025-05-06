import { ChangeEvent, FocusEvent } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { Checkbox as UswdsCheckbox } from '@trussworks/react-uswds';

export default function Checkbox<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  value,
  required,
  disabled,
  readonly,
  label,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  function _onChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.checked);
  }
  function _onBlur(event: FocusEvent<HTMLInputElement>) {
    onBlur(id, event.target.checked);
  }
  function _onFocus(event: FocusEvent<HTMLInputElement>) {
    onFocus(id, event.target.checked);
  }

  return (
    <UswdsCheckbox
      id={id}
      name={id}
      checked={typeof value === 'undefined' ? false : value}
      required={required}
      disabled={disabled || readonly}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      label={label}
    />
  );
}
