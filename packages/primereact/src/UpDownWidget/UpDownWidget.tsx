import { WidgetProps } from "@rjsf/core";
import React from "react";
import { InputNumber, InputNumberChangeParams } from "primereact/inputnumber";

const UpDownWidget = ({
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
  schema,
  uiSchema
}: WidgetProps) => {
  const _onChange = ({ value }: InputNumberChangeParams) => onChange(value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  return (
    <div className="mb-2">
      <label htmlFor={id} className="block">
        {uiSchema["ui:title"] || schema.title || label}
        {(label || uiSchema["ui:title"] || schema.title) && required ? "*" : null}
      </label>
      <InputNumber
        id={id}
        autoFocus={autofocus}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        value={value || value === 0 ? value : ""}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
    </div>
  );
};

export default UpDownWidget;
