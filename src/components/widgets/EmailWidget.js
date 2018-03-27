/* This file has been modified from the original forked source code */
import PropTypes from "prop-types";
import React from "react";

import BaseInput from "./BaseInput";


function EmailWidget(props) {
  return <BaseInput type="email" {...props}/>;
}

if (process.env.NODE_ENV !== "production") {
  EmailWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default EmailWidget;
