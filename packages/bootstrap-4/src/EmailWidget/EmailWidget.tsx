import { WidgetProps } from '@visma/rjsf-core';
import React from "react";

const EmailWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return <TextWidget {...props} type="email" />;
};

export default EmailWidget;
