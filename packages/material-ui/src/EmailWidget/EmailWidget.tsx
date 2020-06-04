import React from "react";
import TextWidget, { TextWidgetProps } from "../TextWidget";

const EmailWidget = (props: TextWidgetProps) => {
  return <TextWidget type="email" {...props} />;
};

export default EmailWidget;
