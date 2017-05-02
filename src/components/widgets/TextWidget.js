import React from "react";
import PropTypes from "prop-types";

import BaseInput from "./BaseInput";

function TextWidget(props) {
  return <BaseInput {...props} />;
}

if (process.env.NODE_ENV !== "production") {
  TextWidget.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };
}

export default TextWidget;
