import React from 'react';
import { WidgetProps } from '@rjsf/core';

const DateWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return (
    <TextWidget
      type="date"
      InputLabelProps={{
        shrink: true,
      }}
      {...props}
    />
  );
};

export default DateWidget;
