import React from "react";

import { TextWidgetProps } from "../TextWidget";

const PasswordWidget = (props: TextWidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return <TextWidget type="password" {...props} />;
};

export default PasswordWidget;
