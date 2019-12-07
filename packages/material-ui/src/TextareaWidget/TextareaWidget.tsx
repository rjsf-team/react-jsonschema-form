import React from 'react';

import { WidgetProps } from 'react-jsonschema-form';

import FormControl from '@material-ui/core/FormControl';
import TextField from '@material-ui/core/TextField';

type CustomWidgetProps = WidgetProps & {
  options: any;
};

const TextareaWidget = ({
  id,
  placeholder,
  value,
  required,
  disabled,
  autofocus,
  label,
  readonly,
  onBlur,
  onFocus,
  onChange,
  options,
  schema,
}: CustomWidgetProps) => {
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
      <TextField
        id={id}
        label={label || schema.title}
        placeholder={placeholder}
        disabled={disabled || readonly}
        value={value}
        required={required}
        autoFocus={autofocus}
        multiline={true}
        rows={options.rows || 5}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
    </FormControl>
  );
};

export default TextareaWidget;
