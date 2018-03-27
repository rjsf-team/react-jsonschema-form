/* This file has been modified from the original forked source code */
import PropTypes from "prop-types";
import React from "react";

import BaseInput from "./BaseInput";


function URLWidget(props) {
  return <BaseInput type="url" {...props}/>;
}

if (process.env.NODE_ENV !== "production") {
  URLWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default URLWidget;
