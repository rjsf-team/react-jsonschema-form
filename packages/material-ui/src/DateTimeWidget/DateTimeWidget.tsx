import React from "react";
import TextWidget, { TextWidgetProps } from "../TextWidget";

const DateTimeWidget = (props: TextWidgetProps) => {
  return (
    <TextWidget
      type="datetime-local"
      InputLabelProps={{
        shrink: true,
      }}
      {...props}
    />
  );
};

export default DateTimeWidget;
