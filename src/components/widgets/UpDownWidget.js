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

function UpDownWidget(props) {
  const {schema, onChange} = props;
  return (
    <BaseInput
      type="number"
      {...props}
      {...rangeSpec(schema)}
      onChange={(event) => onChange(event.target.value)} />
  );
}

if (process.env.NODE_ENV !== "production") {
  UpDownWidget.propTypes = {
    value: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
    ]),
  };
}

export default UpDownWidget;
