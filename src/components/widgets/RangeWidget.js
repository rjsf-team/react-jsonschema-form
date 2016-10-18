import React, { PropTypes } from "react";

import BaseInput from "./BaseInput";


function rangeSpec(schema) {
  const spec = {};
  if (schema.multipleOf) {
    spec.step = schema.multipleOf;
  }
  if (schema.minimum || schema.minimum === 0) {
    spec.min = schema.minimum;
  }
  if (schema.maximum || schema.maximum === 0) {
    spec.max = schema.maximum;
  }
  return spec;
}

function RangeWidget(props) {
  const {schema, value} = props;
  return (
    <div className="field-range-wrapper">
      <BaseInput
        type="range"
        {...props}
        {...rangeSpec(schema)} />
      <span className="range-view">{value}</span>
    </div>
  );
}

if (process.env.NODE_ENV !== "production") {
  RangeWidget.propTypes = {
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
    ]),
  };
}

export default RangeWidget;
