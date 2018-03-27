/* This file has been modified from the original forked source code */
import PropTypes from "prop-types";
import React from "react";

import BaseInput from "./BaseInput";


function TextWidget(props) {
  return <BaseInput {...props}/>;
}

if (process.env.NODE_ENV !== "production") {
  TextWidget.propTypes = {
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
  };
}

export default TextWidget;
