import React, { PropTypes } from "react";

import BaseInput from "./BaseInput";


function DateWidget(props) {
  const {onChange} = props;
  return (
    <BaseInput
      type="date"
      {...props}
      onChange={(event) => onChange(event.target.value)} />
  );
}

if (process.env.NODE_ENV !== "production") {
  DateWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default DateWidget;
