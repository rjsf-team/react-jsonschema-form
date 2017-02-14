import React, { PropTypes } from "react";

import StringField from "./StringField";

import bson from 'bson';

const Double = bson.Double;

function convert (value) {
  const notNumber = value === '' || isNaN(value);
  if (notNumber) {
    return value;
  }

  // NOTE: we may need to validate range for double
  return new Double(value);
}

function round (value) {
  return parseFloat(value).toFixed(2);
}

function DoubleField(props) {
  return (
    <StringField {...props}
      onChange={(value) => props.onChange(convert(value))} 
      onBlur={(event) => props.onChange(convert(round(event.target.value)))} />
  );
}

if (process.env.NODE_ENV !== "production") {
  DoubleField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    idSchema: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func,
    formData: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
      PropTypes.object,
    ]),
    required: PropTypes.bool,
    formContext: PropTypes.object.isRequired,
  };
}

DoubleField.defaultProps = {
  uiSchema: {}
};

export default DoubleField;
