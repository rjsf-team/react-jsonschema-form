import React from 'react';
import { WidgetProps, processSelectValue } from '@rjsf/utils';

import { useMuiComponent } from '../MuiComponentContext';

const SelectWidget = ({
  schema,
  id,
  options,
  label,
  required,
  disabled,
  readonly,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  rawErrors = [],
}: WidgetProps) => {
  const { TextField, MenuItem } = useMuiComponent();
  const { enumOptions, enumDisabled } = options;

  const emptyValue = multiple ? [] : '';

  const _onChange = ({ target: { value } }: React.ChangeEvent<{ name?: string; value: unknown }>) =>
    onChange(processSelectValue(schema, value));
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, processSelectValue(schema, value));
  const _onFocus = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, processSelectValue(schema, value));

  return (
    <TextField
      id={id}
      label={label || schema.title}
      select
      value={typeof value === 'undefined' ? emptyValue : value}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      error={rawErrors.length > 0}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      InputLabelProps={{
        shrink: true,
      }}
      SelectProps={{
        multiple: typeof multiple === 'undefined' ? false : multiple,
      }}
    >
      {(enumOptions as any).map(({ value, label }: any, i: number) => {
        const disabled: any = enumDisabled && (enumDisabled as any).indexOf(value) != -1;
        return (
          <MenuItem key={i} value={value} disabled={disabled}>
            {label}
          </MenuItem>
        );
      })}
    </TextField>
  );
};

export default SelectWidget;
