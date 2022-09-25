import React from "react";
import { rangeSpec, WidgetProps } from "@rjsf/utils";
import Slider from "antd/lib/slider";

const RangeWidget = ({
  autofocus,
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
}: WidgetProps) => {
  const { readonlyAsDisabled = true } = formContext;

  const { min, max, step } = rangeSpec(schema);

  const emptyValue = options.emptyValue || "";

  const handleChange = (nextValue: any) =>
    onChange(nextValue === "" ? emptyValue : nextValue);

  const handleBlur = () => onBlur(id, value);

  const handleFocus = () => onFocus(id, value);

  // Antd's typescript definitions do not contain the following props that are actually necessary and, if provided,
  // they are used, so hacking them in via by spreading `extraProps` on the component to avoid typescript errors
  const extraProps = {
    placeholder,
    onBlur: !readonly ? handleBlur : undefined,
    onFocus: !readonly ? handleFocus : undefined,
  };

  return (
    <Slider
      autoFocus={autofocus}
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      max={max}
      min={min}
      onChange={!readonly ? handleChange : undefined}
      range={false}
      step={step}
      value={value}
      {...extraProps}
    />
  );
};

export default RangeWidget;
