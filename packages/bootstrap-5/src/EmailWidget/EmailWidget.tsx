import React from "react";
import { WidgetProps } from '@rjsf/core';

const EmailWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return <TextWidget {...props} type="email" />;
};

export default EmailWidget;
