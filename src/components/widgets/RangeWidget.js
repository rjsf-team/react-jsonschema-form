import React from "react";
import PropTypes from "prop-types";

import { rangeSpec } from "../../utils";
import { registryShape } from "../../types";

function RangeWidget(props) {
  const { schema, value, registry: { widgets: { BaseInput } } } = props;
  return (
    <div className="field-range-wrapper">
      <BaseInput type="range" {...props} {...rangeSpec(schema)} />
      <span className="range-view">{value}</span>
    </div>
  );
}

if (process.env.NODE_ENV !== "production") {
  RangeWidget.propTypes = {
    registry: registryShape.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };
}

export default RangeWidget;
