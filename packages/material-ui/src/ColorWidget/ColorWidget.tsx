import React from 'react';
import { WidgetProps } from '@rjsf/core';

const ColorWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return <TextWidget type="color" {...props} />;
};

export default ColorWidget;
