import React from "react";
import { WidgetProps } from "@rjsf/core";
import TextWidget from "../TextWidget";

const ColorWidget = (props: WidgetProps) => {
  return <TextWidget type="color" {...props} />;
};

export default ColorWidget;
