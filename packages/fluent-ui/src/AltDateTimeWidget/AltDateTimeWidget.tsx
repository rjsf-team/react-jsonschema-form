import { WidgetProps } from "@visma/rjsf-core";
import React from "react";

const AltDateTimeWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return (
    <TextWidget {...props} />
  );
};

export default AltDateTimeWidget;
