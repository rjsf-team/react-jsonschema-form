import React from "react";
import { WidgetProps } from "@rjsf/core";
import TextWidget from "../TextWidget";

const URLWidget = (props: WidgetProps) => {
  return <TextWidget type="url" {...props} />;
};

export default URLWidget;
