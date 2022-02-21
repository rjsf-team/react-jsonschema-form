import { WidgetProps } from "@rjsf/core";
import { Checkbox, CheckboxChangeParams } from "primereact/checkbox";
import React from "react";

const CheckboxWidget = (props: WidgetProps) => {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    label,
    schema,
    onChange,
  } = props;

  const _onChange = ({ checked }: CheckboxChangeParams) => onChange(checked);

  const desc = label || schema.description;
  return (
    <div className="flex align-items-start gap-2">
      <Checkbox
        inputId={id}
        checked={typeof value === "undefined" ? false : value}
        required={required}
        disabled={disabled || readonly}
        onChange={_onChange}
      />
      <label htmlFor={id}>{desc}</label>
    </div>
  );
};

export default CheckboxWidget;
