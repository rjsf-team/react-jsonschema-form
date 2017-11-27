import React from "react";
import PropTypes from "prop-types";

import { registryShape } from "../../types";

function DateWidget(props) {
  const { onChange, registry: { widgets: { BaseInput } } } = props;
  return (
    <BaseInput
      type="date"
      {...props}
      onChange={value => onChange(value || undefined)}
    />
  );
}

if (process.env.NODE_ENV !== "production") {
  DateWidget.propTypes = {
    registry: registryShape.isRequired,
    value: PropTypes.string,
  };
}

export default DateWidget;
