import React from "react";
import TextWidget, { TextWidgetProps } from "../TextWidget";

const ColorWidget = (props: TextWidgetProps) => {
  return <TextWidget type="color" {...props} />;
};

export default ColorWidget;
