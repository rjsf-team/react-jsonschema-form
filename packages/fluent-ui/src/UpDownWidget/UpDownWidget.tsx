import React from "react";
import { Label } from "@fluentui/react";
import { SpinButton } from "@fluentui/react";
import { WidgetProps } from "@rjsf/core";
import _pick from "lodash/pick";
import { utils } from "@rjsf/core";

const { rangeSpec } = utils;

// Keys of ISpinButtonProps from @fluentui/react
const allowedProps = [
  "ariaDescribedBy",
  "ariaLabel",
  "ariaPositionInSet",
  "ariaSetSize",
  "ariaValueNow",
  "ariaValueText",
  "className",
  "componentRef",
  "decrementButtonAriaLabel",
  "decrementButtonIcon",
  "defaultValue",
  "disabled",
  "downArrowButtonStyles",
  "getClassNames",
  "iconButtonProps",
  "iconProps",
  "incrementButtonAriaLabel",
  "incrementButtonIcon",
  "inputProps",
  "keytipProps",
  "label",
  "labelPosition",
  "max",
  "min",
  "onBlur",
  "onDecrement",
  "onFocus",
  "onIncrement",
  "onValidate",
  "precision",
  "step",
  "styles",
  "theme",
  "title",
  "upArrowButtonStyles",
  "value"
];

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
  options,
  schema,
}: // autofocus,
WidgetProps) => {
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) => onChange(Number(value));

  const _onIncrement = (value: string) => onChange(Number(value) + 1);

  const _onDecrement = (value: string) => onChange(Number(value) - 1);

  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const requiredSymbol = required ? "*" : "";
  
  const uiProps = _pick(options.props || {}, allowedProps);

  const { min, max, step } = rangeSpec(schema);

  console.error(min, max, step);

  return (
    <>
    {/* TODO: add label for= attribute */}
      <Label>{label + requiredSymbol}</Label>
      <SpinButton
        min={min}
        max={max}
        step={step}
        incrementButtonAriaLabel={"Increase value by 1"}
        decrementButtonAriaLabel={"Decrease value by 1"}
        disabled={disabled || readonly}
        value={value ? value : ""}
        onBlur={_onBlur}
        onFocus={_onFocus}
        onChange={_onChange}
        onIncrement={_onIncrement}
        onDecrement={_onDecrement}
        {...uiProps}
      />
    </>
  );
};

export default UpDownWidget;
