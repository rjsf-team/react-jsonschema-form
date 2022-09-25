import React from "react";
import { WidgetProps } from "@rjsf/utils";

import _AltDateWidget from "../AltDateWidget";

const AltDateTimeWidget = (props: WidgetProps) => {
  const { AltDateWidget } = props.registry.widgets;
  return <AltDateWidget showTime {...props} />;
};

AltDateTimeWidget.defaultProps = {
  ..._AltDateWidget.defaultProps,
  showTime: true,
};

export default AltDateTimeWidget;
