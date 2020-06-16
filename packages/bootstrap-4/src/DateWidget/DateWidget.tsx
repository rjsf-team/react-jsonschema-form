import React from "react";
import TextWidget, { TextWidgetProps } from "../TextWidget";

const DateWidget = (props: TextWidgetProps) => {
  return (
    <TextWidget
      type="date"
      {...props}
    />
  );
};

export default DateWidget;