import React, { PropTypes } from "react";

import BaseInput from "./BaseInput";


function rangeSpec(schema) {
  const spec = {};
  if (schema.multipleOf) {
    spec.step = schema.multipleOf;
  }
  if (schema.minimum) {
    spec.min = schema.minimum;
  }
  if (schema.maximum) {
    spec.max = schema.maximum;
  }
  return spec;
}

function RangeWidget(props) {
  const {schema, value, onChange} = props;
  return (
    <div className="field-range-wrapper">
      <BaseInput
        type="range"
        {...props}
        {...rangeSpec(schema)}
        onChange={(event) => onChange(event.target.value)} />
      <span className="range-view">{value}</span>
    </div>
  );
}

if (process.env.NODE_ENV !== "production") {
  RangeWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
    ]),
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default RangeWidget;
