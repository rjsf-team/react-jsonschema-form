import React from "react";
import dayjs from "dayjs";
import { WidgetProps } from "@rjsf/utils";

import DatePicker from "../../components/DatePicker";

const DATE_PICKER_STYLE = {
  width: "100%",
};

const DateTimeWidget = ({
  disabled,
  formContext,
  id,
  onBlur,
  onChange,
  onFocus,
  placeholder,
  readonly,
  value,
}: WidgetProps) => {
  const { readonlyAsDisabled = true } = formContext;

  const handleChange = (nextValue: any) =>
    onChange(nextValue && nextValue.toISOString());

  const handleBlur = () => onBlur(id, value);

  const handleFocus = () => onFocus(id, value);

  const getPopupContainer = (node: any) => node.parentNode;

  return (
    <DatePicker
      disabled={disabled || (readonlyAsDisabled && readonly)}
      getPopupContainer={getPopupContainer}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      showTime
      style={DATE_PICKER_STYLE}
      value={value && dayjs(value)}
    />
  );
};

export default DateTimeWidget;
