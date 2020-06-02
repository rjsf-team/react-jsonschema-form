import React from "react";
import { WidgetProps } from "@rjsf/core";
import TextWidget from "../TextWidget";

const DateWidget = (props: WidgetProps) => {
  return <TextWidget type="date" {...props} />;
};

export default DateWidget;
