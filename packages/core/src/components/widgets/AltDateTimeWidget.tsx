import { WidgetProps } from "@rjsf/utils";
import React from "react";
import AltDateWidget from "./AltDateWidget";

function AltDateTimeWidget<T = any, F = any>({
  time = true,
  ...props
}: WidgetProps<T, F>) {
  const { AltDateWidget } = props.registry.widgets;
  return <AltDateWidget time={time} {...props} />;
}

AltDateTimeWidget.defaultProps = {
  ...AltDateWidget.defaultProps,
  time: true,
};

export default AltDateTimeWidget;
