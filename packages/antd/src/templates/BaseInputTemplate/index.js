import React from "react";
import { getInputProps } from "@rjsf/utils";
import Input from "antd/lib/input";
import InputNumber from "antd/lib/input-number";

const INPUT_STYLE = {
  width: "100%",
};

const TextWidget = ({
  // autofocus,
  disabled,
  formContext,
  id,
  // label,
  onBlur,
  onChange,
  onFocus,
  options,
  placeholder,
  readonly,
  // required,
  schema,
  value,
  type,
}) => {
  const inputProps = getInputProps(schema, type, options, false);
  const { readonlyAsDisabled = true } = formContext;

  const handleNumberChange = (nextValue) => onChange(nextValue);

  const handleTextChange = ({ target }) =>
    onChange(target.value === "" ? options.emptyValue : target.value);

  const handleBlur = ({ target }) => onBlur(id, target.value);

  const handleFocus = ({ target }) => onFocus(id, target.value);

  return inputProps.type === "number" || inputProps.type === "integer" ? (
    <InputNumber
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleNumberChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      style={INPUT_STYLE}
      {...inputProps}
      value={value}
    />
  ) : (
    <Input
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleTextChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      style={INPUT_STYLE}
      {...inputProps}
      value={value}
    />
  );
};

export default TextWidget;
