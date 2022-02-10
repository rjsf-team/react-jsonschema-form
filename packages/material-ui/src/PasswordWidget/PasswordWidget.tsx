import React from 'react';

import { WidgetProps } from '@rjsf/core';

const PasswordWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return <TextWidget type="password" {...props} />;
};

export default PasswordWidget;
