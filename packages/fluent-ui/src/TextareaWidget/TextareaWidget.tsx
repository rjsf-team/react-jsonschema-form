import React from "react";

import { WidgetProps } from "@rjsf/core";

import { TextField } from "@fluentui/react";

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
  rawErrors,
}: CustomWidgetProps) => {
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
    <>
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
        onChange={_onChange as any}
        onBlur={_onBlur}
        onFocus={_onFocus}
        errorMessage={(rawErrors || []).join("\n")}
      />
    </>
  );
};

export default TextareaWidget;
