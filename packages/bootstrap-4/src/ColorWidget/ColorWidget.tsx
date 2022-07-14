import React from "react";
import { WidgetProps } from '@rjsf/utils';

const ColorWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return <TextWidget {...props} type="color" />;
};

export default ColorWidget;
