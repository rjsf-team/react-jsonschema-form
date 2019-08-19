import React from 'react';

import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';

import { WidgetProps } from 'react-jsonschema-form';

const PasswordWidget = ({
  id,
  required,
  readonly,
  disabled,
  value,
  label,
  onFocus,
  onBlur,
  onChange,
  options,
  autofocus,
  schema,
}: WidgetProps) => {
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  return (
    <FormControl
      fullWidth={true}
      //error={!!rawErrors}
      required={required}
    >
      <InputLabel>{label || schema.title}</InputLabel>
      <Input
        autoFocus={autofocus}
        required={required}
        disabled={disabled || readonly}
        type="password"
        value={value ? value : ''}
        onFocus={_onFocus}
        onBlur={_onBlur}
        onChange={_onChange}
      />
    </FormControl>
  );
};

export default PasswordWidget;
