  
import React from "react";

import _AltDateWidget from "../AltDateWidget";

const AltDateTimeWidget = (props) => {
  const { AltDateWidget } = props.registry.widgets;
  return <AltDateWidget showTime {...props} />;
};

AltDateTimeWidget.defaultProps = {
  ..._AltDateWidget.defaultProps,
  showTime: true,
};

export default AltDateTimeWidget;
