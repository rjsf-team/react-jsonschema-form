import React from "react";

import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";

import { WidgetProps } from "@rjsf/core";
import { utils } from "@rjsf/core";

const { processNewValue } = utils

const SelectWidget = ({
  schema,
  uiSchema,
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
  const { enumOptions, enumDisabled } = options;

  const emptyValue = multiple ? [] : "";

  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<{ name?: string; value: unknown }>) =>
    onChange(processNewValue({ schema, uiSchema, newValue: value }));
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, processNewValue({ schema, uiSchema, newValue: value }));
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, processNewValue({ schema, uiSchema, newValue: value }));

  return (
    <TextField
      id={id}
      label={label || schema.title}
      select
      value={typeof value === "undefined" ? emptyValue : value}
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
        multiple: typeof multiple === "undefined" ? false : multiple,
      }}>
      {(enumOptions as any).map(({ value, label }: any, i: number) => {
        const disabled: any =
          enumDisabled && (enumDisabled as any).indexOf(value) != -1;
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
