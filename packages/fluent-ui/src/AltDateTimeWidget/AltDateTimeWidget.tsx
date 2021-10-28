import React from "react";
import { WidgetProps } from "@rjsf/core";

const AltDateTimeWidget = (props: WidgetProps) => {
  const { registry } = props;
  const { TextWidget } = registry.widgets;
  return (
    <TextWidget {...props} />
  );
};

export default AltDateTimeWidget;
