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
  "value",
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

  let { min, max, step } = rangeSpec(schema);
  if (min === undefined) {
    min = -1 * Infinity;
  }
  if (max === undefined) {
    max = Infinity;
  }
  if (step === undefined) {
    step = 1;
  }

  const _onIncrement = (value: string) => {
    if (Number(value) + step! <= max!) onChange(Number(value) + step!);
  };

  const _onDecrement = (value: string) => {
    if (Number(value) - step! >= min!) onChange(Number(value) - step!);
  };

  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const requiredSymbol = required ? "*" : "";

  const uiProps = _pick(options.props || {}, allowedProps);

  return (
    <>
      {/* TODO: add label for= attribute */}
      <Label htmlFor={id}>{label + requiredSymbol}</Label>
      <SpinButton
        id={id}
        min={min}
        max={max}
        step={step}
        incrementButtonAriaLabel={"Increase value by 1"}
        decrementButtonAriaLabel={"Decrease value by 1"}
        disabled={disabled || readonly}
        value={value || value === 0 ? value : ""}
        onBlur={_onBlur}
        onFocus={_onFocus}
        onChange={_onChange}
        onIncrement={_onIncrement}
        onDecrement={_onDecrement}
        for=""
        {...uiProps}
      />
    </>
  );
};

export default UpDownWidget;
