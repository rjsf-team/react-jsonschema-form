import React from "react";
import TextWidget, { TextWidgetProps } from "../TextWidget";

const URLWidget = (props: TextWidgetProps) => {
  return <TextWidget {...props} type="url" />;
};

export default URLWidget;
