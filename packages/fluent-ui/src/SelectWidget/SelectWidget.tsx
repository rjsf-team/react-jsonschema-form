import React from "react";
import { Label, Dropdown } from "@fluentui/react";
import { WidgetProps } from "@rjsf/core";


const SelectWidget = ({
  schema,
  id,
  options,
  label,
  required,
  disabled,
  readonly,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps) => {
  const { enumOptions, enumDisabled } = options;

  const _onChange = (_: any, value: any) => onChange(value.key);

  const _onBlur = (e: any) => onBlur(id, e.target.value);

  const _onFocus = (e: any) => onFocus(id, e.target.value);

  const newOptions = (enumOptions as {value: any, label: any}[]).map(option => ({
    key: option.value,
    text: option.label,
    disabled: (enumDisabled as any[] || []).indexOf(option.value) !== -1
  }));

  return (
    <>
      <Label>{label || schema.title}</Label>
      <Dropdown
        multiSelect={typeof multiple === "undefined" ? false : multiple}
        defaultSelectedKey={value}
        required={required}
        options={newOptions}
        disabled={disabled || readonly}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
    </>
  );
};

export default SelectWidget;
