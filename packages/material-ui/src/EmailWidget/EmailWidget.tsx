import React from "react";
import { WidgetProps } from "@rjsf/core";
import TextWidget from "../TextWidget";

const EmailWidget = (props: WidgetProps) => {
  return <TextWidget type="email" {...props} />;
};

export default EmailWidget;
