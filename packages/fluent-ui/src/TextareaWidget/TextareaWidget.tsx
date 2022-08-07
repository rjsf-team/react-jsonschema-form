import React from "react";
import { WidgetProps } from "@rjsf/utils";

const TextareaWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { BaseInputTemplate } = registry.templates;
  // TODO: rows and columns.
  return <BaseInputTemplate {...props} multiline />;
};

export default TextareaWidget;
