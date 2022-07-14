import React from "react";
import { WidgetProps } from '@rjsf/utils';

const FileWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return <TextWidget {...props} type="file"/>;
};

export default FileWidget;
