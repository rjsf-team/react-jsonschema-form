import React from "react";
import TextWidget, { TextWidgetProps } from "../TextWidget";

const DateWidget = (props: TextWidgetProps) => {
  return (
    <TextWidget
      type="date"
      InputLabelProps={{
        shrink: true,
      }}
      {...props}
    />
  );
};

export default DateWidget;
