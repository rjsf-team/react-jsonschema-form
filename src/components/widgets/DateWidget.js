/* This file has been modified from the original forked source code */
import PropTypes from "prop-types";
import React from "react";

import BaseInput from "./BaseInput";


function DateWidget(props) {
  const {onChange} = props;
  return (
    <BaseInput
      type="date"
      {...props}
      onChange={(value) => onChange(value || undefined)}/>
  );
}

if (process.env.NODE_ENV !== "production") {
  DateWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default DateWidget;
