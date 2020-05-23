import React from "react";
import { TextField } from "@fluentui/react";
import { WidgetProps } from "@rjsf/core";

const TextWidget = ({
  id,
  required,
  readonly,
  disabled,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  autofocus,
  options,
  schema,
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

  return (
    <TextField
      id={id}
      label={label || schema.title}
      autoFocus={autofocus}
      required={required}
      disabled={disabled || readonly}
      name={name}
      type={schema.type as string}
      value={value ? value : ""}
      onChange={_onChange as any}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
};

export default TextWidget;
