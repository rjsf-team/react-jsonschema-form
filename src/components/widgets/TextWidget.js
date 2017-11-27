import React from "react";
import PropTypes from "prop-types";

import { registryShape } from "../../types";

function TextWidget(props) {
  const { BaseInput } = props.registry.widgets;
  return <BaseInput {...props} />;
}

if (process.env.NODE_ENV !== "production") {
  TextWidget.propTypes = {
    registry: registryShape.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };
}

export default TextWidget;
