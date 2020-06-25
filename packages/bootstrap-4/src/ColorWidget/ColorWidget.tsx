import React from "react";
import TextWidget, { TextWidgetProps } from "../TextWidget";

export interface ColorWidget extends TextWidgetProps {
    type?: string;
}

const ColorWidget = (props: TextWidgetProps) => {
  return <TextWidget type="color" {...props} />;
};

export default ColorWidget;
