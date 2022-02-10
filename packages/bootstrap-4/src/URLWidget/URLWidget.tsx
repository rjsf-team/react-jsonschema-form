import React from "react";
import { WidgetProps } from '@rjsf/core';

const URLWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return <TextWidget {...props} type="url" />;
};

export default URLWidget;
