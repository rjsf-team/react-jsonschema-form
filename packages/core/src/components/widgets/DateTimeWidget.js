import React from "react";
import PropTypes from "prop-types";
import { utcToLocal, localToUTC } from "../../utils";

function DateTimeWidget(props) {
  const {
    value,
    onChange,
    registry: {
      widgets: { BaseInput },
    },
  } = props;
  return (
    <BaseInput
      type="datetime-local"
      {...props}
      value={utcToLocal(value)}
      onChange={value => onChange(localToUTC(value))}
    />
  );
}

if (process.env.NODE_ENV !== "production") {
  DateTimeWidget.propTypes = {
    value: PropTypes.string,
  };
}

export default DateTimeWidget;
