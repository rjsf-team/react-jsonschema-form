import React from "react";
import TextWidget, { TextWidgetProps } from "../TextWidget";

const ColorWidget = (props: TextWidgetProps) => {
  return <TextWidget {...props} type="color" />;
};

export default ColorWidget;
