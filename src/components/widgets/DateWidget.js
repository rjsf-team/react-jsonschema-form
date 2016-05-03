import React, { PropTypes } from "react";

import BaseInput from "./BaseInput";


function DateWidget(props) {
  return <BaseInput type="date" {...props} />;
}

if (process.env.NODE_ENV !== "production") {
  DateWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default DateWidget;
