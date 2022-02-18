import { WidgetProps } from "@rjsf/core";
import { Password } from "primereact/password";
import React from "react";
import cn from "clsx";

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
  uiSchema,
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

  return (
    <div>
      <label htmlFor={id} className={cn("block", rawErrors.length > 0 ? "text-color-danger" : undefined)}>
        {uiSchema["ui:title"] || schema.title || label}
        {(label || uiSchema["ui:title"] || schema.title) && required ? "*" : null}
      </label>
      <Password
        inputId={id}
        autoFocus={autofocus}
        className={rawErrors.length > 0 ? "p-invalid" : undefined}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        value={value ? value : ""}
        onChange={_onChange}
        onFocus={_onFocus}
        onBlur={_onBlur}
      />
    </div>
  );
};

export default PasswordWidget;
