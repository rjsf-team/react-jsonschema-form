import React from "react";
import { WidgetProps } from "@rjsf/utils";
import Input from "antd/lib/input";

const INPUT_STYLE = {
  width: "100%",
};

const TextareaWidget = ({
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

  const handleChange = ({ target }: React.ChangeEvent<HTMLTextAreaElement>) =>
    onChange(target.value === "" ? options.emptyValue : target.value);

  const handleBlur = ({ target }: React.FocusEvent<HTMLTextAreaElement>) =>
    onBlur(id, target.value);

  const handleFocus = ({ target }: React.FocusEvent<HTMLTextAreaElement>) =>
    onFocus(id, target.value);

  // Antd's typescript definitions do not contain the following props that are actually necessary and, if provided,
  // they are used, so hacking them in via by spreading `extraProps` on the component to avoid typescript errors
  const extraProps = {
    type: "textarea",
  };

  return (
    <Input.TextArea
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      rows={options.rows || 4}
      style={INPUT_STYLE}
      value={value}
      {...extraProps}
    />
  );
};

export default TextareaWidget;
