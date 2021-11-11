import React from "react";
import { TextWidgetProps } from "../TextWidget";

const ColorWidget = (props: TextWidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return <TextWidget type="color" {...props} />;
};

export default ColorWidget;
