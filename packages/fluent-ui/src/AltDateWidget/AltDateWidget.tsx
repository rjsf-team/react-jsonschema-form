import { WidgetProps } from "@visma/rjsf-core";
import React from "react";

const AltDateWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return (
    <TextWidget {...props} />
  );
};

export default AltDateWidget;
