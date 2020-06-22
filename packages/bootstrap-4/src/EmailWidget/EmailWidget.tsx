import React from "react";
import TextWidget, { TextWidgetProps } from "../TextWidget";

const EmailWidget = (props: TextWidgetProps) => {
  return <TextWidget {...props} type="email" />;
};

export default EmailWidget;
