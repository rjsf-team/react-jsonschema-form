import React from "react";

import _AltDateWidget from "../AltDateWidget";
import { WidgetProps } from "@rjsf/utils";

const AltDateTimeWidget = (props: WidgetProps) => {
  const { AltDateWidget } = props.registry.widgets;
  return <AltDateWidget {...props} showTime />;
};

AltDateTimeWidget.defaultProps = {
  ..._AltDateWidget.defaultProps,
  showTime: true,
};

export default AltDateTimeWidget;
