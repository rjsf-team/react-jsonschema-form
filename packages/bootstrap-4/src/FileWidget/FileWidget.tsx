import { WidgetProps } from '@visma/rjsf-core';
import React from "react";

const FileWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return <TextWidget {...props} type="file"/>;
};

export default FileWidget;
