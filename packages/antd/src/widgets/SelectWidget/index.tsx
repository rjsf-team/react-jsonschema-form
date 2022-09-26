import React from "react";
import { processSelectValue, WidgetProps } from "@rjsf/utils";
import Select from "antd/lib/select";

const SELECT_STYLE = {
  width: "100%",
};

const SelectWidget = ({
  autofocus,
  disabled,
  formContext,
  id,
  multiple,
  onBlur,
  onChange,
  onFocus,
  options,
  placeholder,
  readonly,
  schema,
  value,
}: WidgetProps) => {
  const { readonlyAsDisabled = true } = formContext;

  const { enumOptions, enumDisabled } = options;

  const handleChange = (nextValue: any) =>
    onChange(processSelectValue(schema, nextValue, options));

  const handleBlur = () =>
    onBlur(id, processSelectValue(schema, value, options));

  const handleFocus = () =>
    onFocus(id, processSelectValue(schema, value, options));

  const getPopupContainer = (node: any) => node.parentNode;

  const stringify = (currentValue: any) =>
    Array.isArray(currentValue) ? value.map(String) : String(value);

  // Antd's typescript definitions do not contain the following props that are actually necessary and, if provided,
  // they are used, so hacking them in via by spreading `extraProps` on the component to avoid typescript errors
  const extraProps = {
    name: id,
  };
  return (
    <Select
      autoFocus={autofocus}
      disabled={disabled || (readonlyAsDisabled && readonly)}
      getPopupContainer={getPopupContainer}
      id={id}
      mode={typeof multiple !== "undefined" ? "multiple" : undefined}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      style={SELECT_STYLE}
      value={typeof value !== "undefined" ? stringify(value) : undefined}
      {...extraProps}
    >
      {Array.isArray(enumOptions) &&
        enumOptions.map(({ value: optionValue, label: optionLabel }) => (
          <Select.Option
            disabled={
              Array.isArray(enumDisabled) &&
              enumDisabled.indexOf(optionValue) !== -1
            }
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
