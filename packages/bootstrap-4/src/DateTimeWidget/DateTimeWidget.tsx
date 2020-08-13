import React from "react";
import { utils } from "@rjsf/core";
import TextWidget, { TextWidgetProps } from "../TextWidget";

const { localToUTC, utcToLocal } = utils;

const DateTimeWidget = (props: TextWidgetProps) => {
  const value = utcToLocal(props.value);
  const onChange = (value: any) => {
    props.onChange(localToUTC(value));
  };

  return (
    <TextWidget  
      {...props}
      type="datetime-local"
      value={value}
      onChange={onChange}
    />
  );
};

export default DateTimeWidget;
