import React from "react";
import TextWidget, { TextWidgetProps } from "../TextWidget";

const URLWidget = (props: TextWidgetProps) => {
  return <TextWidget type="url" {...props} />;
};

export default URLWidget;
