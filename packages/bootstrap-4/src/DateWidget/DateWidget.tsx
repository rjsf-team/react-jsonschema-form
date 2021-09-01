import { WidgetProps } from '@visma/rjsf-core';
import React from "react";

const DateWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return (
    <TextWidget
      {...props}
      type="date"
    />
  );
};

export default DateWidget;
