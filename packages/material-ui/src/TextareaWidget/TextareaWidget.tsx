import React from "react";
import TextField from "@material-ui/core/TextField";
import { WidgetProps } from "@rjsf/utils";

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
  rawErrors = [],
}: WidgetProps) => {
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  let rows: string | number = 5;
  if (typeof options.rows === "string" || typeof options.rows === "number") {
    rows = options.rows;
  }

  return (
    <TextField
      id={id}
      label={label || schema.title}
      placeholder={placeholder}
      disabled={disabled || readonly}
      value={value}
      required={required}
      autoFocus={autofocus}
      multiline={true}
      rows={rows}
      error={rawErrors.length > 0}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
};

export default TextareaWidget;
