import React from "react";
import { Label } from "@fluentui/react";
import { SpinButton } from "@fluentui/react";
import { WidgetProps } from "@rjsf/core";

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
}: // autofocus,
WidgetProps) => {
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) => onChange(value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const requiredSymbol = required ? "*" : "";

  return (
    <>
      <Label>{label + requiredSymbol}</Label>
      <SpinButton
        defaultValue="0"
        min={1}
        max={100}
        step={1}
        incrementButtonAriaLabel={"Increase value by 1"}
        decrementButtonAriaLabel={"Decrease value by 1"}
        disabled={disabled || readonly}
        value={value ? value : ""}
        onBlur={_onBlur}
        onFocus={_onFocus}
        onChange={_onChange}
      />
    </>
  );
};

export default UpDownWidget;
