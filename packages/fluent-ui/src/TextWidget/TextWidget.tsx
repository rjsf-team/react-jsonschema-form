import React from "react";
import { TextField } from "@fluentui/react";
import { WidgetProps } from "@rjsf/core";
import _pick from "lodash/pick";

// Keys of ITextFieldProps from @fluentui/react
const allowedProps = [
  "multiline",
  "resizable",
  "autoAdjustHeight",
  "underlined",
  "borderless",
  "label",
  "onRenderLabel",
  "description",
  "onRenderDescription",
  "prefix",
  "suffix",
  "onRenderPrefix",
  "onRenderSuffix",
  "iconProps",
  "defaultValue",
  "value",
  "disabled",
  "readOnly",
  "errorMessage",
  "onChange",
  "onNotifyValidationResult",
  "onGetErrorMessage",
  "deferredValidationTime",
  "className",
  "inputClassName",
  "ariaLabel",
  "validateOnFocusIn",
  "validateOnFocusOut",
  "validateOnLoad",
  "theme",
  "styles",
  "autoComplete",
  "mask",
  "maskChar",
  "maskFormat",
  "type",
  "list",
];

const TextWidget = ({
  id,
  placeholder,
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
  rawErrors,
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

  const uiProps = _pick(options.props || {}, allowedProps);
  const inputType = schema.type === 'string' ?  'text' : `${schema.type}`

  return (
    <TextField
      id={id}
      placeholder={placeholder}
      label={label || schema.title}
      autoFocus={autofocus}
      required={required}
      disabled={disabled}
      readOnly={readonly}
      // TODO: once fluent-ui supports the name prop, we can add it back in here.
      // name={name}
      type={inputType as string}
      value={value || value === 0 ? value : ""}
      onChange={_onChange as any}
      onBlur={_onBlur}
      onFocus={_onFocus}
      errorMessage={(rawErrors || []).join("\n")}
      {...uiProps}
    />
  );
};

export default TextWidget;
