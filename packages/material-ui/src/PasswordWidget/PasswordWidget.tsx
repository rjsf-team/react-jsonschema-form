import React from "react";
import { WidgetProps } from "@rjsf/utils";

const PasswordWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return <TextWidget type="password" {...props} />;
};

export default PasswordWidget;
