import React from "react";
import PropTypes from "prop-types";

import { rangeSpec } from "../../utils";

function RangeWidget(props) {
  const {
    schema,
    value,
    registry: {
      widgets: { BaseInput },
    },
  } = props;

  return (
    <div className="field-range-wrapper">
      <BaseInput
        type="range"
        {...props}
        value={value ? value : 0}
        {...rangeSpec(schema)}
      />
      <span className="range-view">{value}</span>
    </div>
  );
}

if (process.env.NODE_ENV !== "production") {
  RangeWidget.propTypes = {
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };
}

export default RangeWidget;
