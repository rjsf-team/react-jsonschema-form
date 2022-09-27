import React from "react";
import { WidgetProps } from "@rjsf/utils";
import Checkbox, { CheckboxChangeEvent } from "antd/lib/checkbox";

const CheckboxWidget = ({
  autofocus,
  disabled,
  formContext,
  id,
  label,
  onBlur,
  onChange,
  onFocus,
  readonly,
  value,
}: WidgetProps) => {
  const { readonlyAsDisabled = true } = formContext;

  const handleChange = ({ target }: CheckboxChangeEvent) =>
    onChange(target.checked);

  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, target.checked);

  const handleFocus = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, target.checked);

  // Antd's typescript definitions do not contain the following props that are actually necessary and, if provided,
  // they are used, so hacking them in via by spreading `extraProps` on the component to avoid typescript errors
  const extraProps = {
    onBlur: !readonly ? handleBlur : undefined,
    onFocus: !readonly ? handleFocus : undefined,
  };

  return (
    <Checkbox
      autoFocus={autofocus}
      checked={typeof value === "undefined" ? false : value}
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onChange={!readonly ? handleChange : undefined}
      {...extraProps}
    >
      {label}
    </Checkbox>
  );
};

export default CheckboxWidget;
