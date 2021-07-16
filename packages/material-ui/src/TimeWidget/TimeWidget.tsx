import React from "react";
import TextWidget, { TextWidgetProps } from "../TextWidget";

const TimeWidget = (props: TextWidgetProps) => {
  const onChange = (value: any) => {
    props.onChange(value ? `${value}:00` : value); // string || undefined
  };

  return (
    <TextWidget
      type="time"
      InputLabelProps={{
        shrink: true,
      }}
      inputProps={{
        step: 1
      }}
      {...props}
      onChange={onChange}
    />
  );
};

export default TimeWidget;
