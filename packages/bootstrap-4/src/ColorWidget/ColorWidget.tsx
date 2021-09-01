import { WidgetProps } from '@visma/rjsf-core';
import React from "react";

const ColorWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return <TextWidget {...props} type="color" />;
};

export default ColorWidget;
