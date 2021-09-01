import { WidgetProps } from '@visma/rjsf-core';
import React from "react";

const URLWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return <TextWidget {...props} type="url" />;
};

export default URLWidget;
