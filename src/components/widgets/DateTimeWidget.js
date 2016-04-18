import React, { PropTypes } from "react";

import DateWidget from "./DateWidget";


function DateTimeWidget(props) {
  return <DateWidget time {...props} />;
}

if (process.env.NODE_ENV !== "production") {
  DateTimeWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: React.PropTypes.string,
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default DateTimeWidget;
