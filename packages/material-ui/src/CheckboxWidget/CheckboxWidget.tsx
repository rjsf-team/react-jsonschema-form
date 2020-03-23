import React from 'react';

import Checkbox from '@material-ui/core/Checkbox';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';

import { WidgetProps } from '@rjsf/core';

const CheckboxWidget = ({
  id,
  value,
  required,
  disabled,
  readonly,
  label,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  options,
  schema
}: WidgetProps) => {
  const uiProps = options["props"];
  
  const _onChange = ({}, checked: boolean) => onChange(checked);
  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLButtonElement>) => onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLButtonElement>) => onFocus(id, value);

  return (
    <FormControl fullWidth={true} required={required}>
      <FormControlLabel
        control={
          <Checkbox
            id={id}
            checked={typeof value === 'undefined' ? false : value}
            required={required}
            disabled={disabled || readonly}
            autoFocus={autofocus}
            onChange={_onChange}
            onBlur={_onBlur}
            onFocus={_onFocus}
            {...uiProps}
          />
        }
        label={label || schema.title}
      />
    </FormControl>
  );
};

export default CheckboxWidget;
