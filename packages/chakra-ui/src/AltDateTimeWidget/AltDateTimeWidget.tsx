import React from "react";

import _AltDateWidget from "../AltDateWidget";
import { TextWidgetProps } from "TextWidget";

const AltDateTimeWidget = (props: TextWidgetProps) => {
  const { AltDateWidget } = props.registry.widgets;
  return <AltDateWidget {...props} showTime />;
};

AltDateTimeWidget.defaultProps = {
  ..._AltDateWidget.defaultProps,
  showTime: true,
};

export default AltDateTimeWidget;
