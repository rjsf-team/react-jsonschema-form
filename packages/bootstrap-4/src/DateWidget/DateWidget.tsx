import React from "react";
import TextWidget, { TextWidgetProps } from "../TextWidget";

const DateWidget = (props: TextWidgetProps) => {
  return (
    <TextWidget
      {...props}   
      type="date"
    />
  );
};

export default DateWidget;