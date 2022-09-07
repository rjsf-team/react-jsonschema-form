/* eslint-disable no-else-return */
import React from "react";

import { processSelectValue } from "@rjsf/utils";
import Select from "antd/lib/select";

const SELECT_STYLE = {
  width: "100%",
};

const SelectWidget = ({
  autofocus,
  disabled,
  formContext,
  id,
  // label,
  multiple,
  onBlur,
  onChange,
  onFocus,
  options,
  placeholder,
  readonly,
  // required,
  schema,
  value,
}) => {
  const { readonlyAsDisabled = true } = formContext;

  const { enumOptions, enumDisabled } = options;

  const handleChange = (nextValue) =>
    onChange(processSelectValue(schema, nextValue, options));

  const handleBlur = () =>
    onBlur(id, processSelectValue(schema, value, options));

  const handleFocus = () =>
    onFocus(id, processSelectValue(schema, value, options));

  const getPopupContainer = (node) => node.parentNode;

  const stringify = (currentValue) =>
    Array.isArray(currentValue) ? value.map(String) : String(value);

  return (
    <Select
      autoFocus={autofocus}
      disabled={disabled || (readonlyAsDisabled && readonly)}
      getPopupContainer={getPopupContainer}
      id={id}
      mode={typeof multiple !== "undefined" ? "multiple" : undefined}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      style={SELECT_STYLE}
      value={typeof value !== "undefined" ? stringify(value) : undefined}
    >
      {enumOptions.map(({ value: optionValue, label: optionLabel }) => (
        <Select.Option
          disabled={enumDisabled && enumDisabled.indexOf(optionValue) !== -1}
          key={String(optionValue)}
          value={String(optionValue)}
        >
          {optionLabel}
        </Select.Option>
      ))}
    </Select>
  );
};

SelectWidget.defaultProps = {
  formContext: {},
};

export default SelectWidget;
