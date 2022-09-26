import React from "react";
import { WidgetProps } from "@rjsf/utils";
import Input from "antd/lib/input";

const PasswordWidget = ({
  disabled,
  formContext,
  id,
  onBlur,
  onChange,
  onFocus,
  options,
  placeholder,
  readonly,
  value,
}: WidgetProps) => {
  const { readonlyAsDisabled = true } = formContext;

  const emptyValue = options.emptyValue || "";

  const handleChange = ({ target }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(target.value === "" ? emptyValue : target.value);

  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, target.value);

  const handleFocus = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, target.value);

  return (
    <Input.Password
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      value={value || ""}
    />
  );
};

export default PasswordWidget;
