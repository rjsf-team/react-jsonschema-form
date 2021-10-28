import React from "react";
import { WidgetProps } from '@rjsf/core';

const FileWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return <TextWidget {...props} type="file"/>;
};

export default FileWidget;
