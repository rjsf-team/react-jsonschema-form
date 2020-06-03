import React from "react";
import { WidgetProps } from "@rjsf/core";
import TextWidget from "../TextWidget";

const DateTimeWidget = (props: WidgetProps) => {
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
