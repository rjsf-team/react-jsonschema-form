import React, { PropTypes } from "react";
import bson from 'bson';
const { Long, BSON_INT64_MAX, BSON_INT64_MIN } = bson;

import { isInteger } from "../../utils";
import StringField from "./StringField";

function convert (value) {
  if (!isInteger(value)) {
    return value;
  }

  const number = Number(value);
  const isOutOfRange = number < BSON_INT64_MIN || number > BSON_INT64_MAX;
  if (isOutOfRange) {
    return value;
  }

  return Long.fromString(number.toString());
}

function LongField(props) {
  return (
    <StringField {...props}
      onChange={(value) => props.onChange(convert(value))} />
  );
}

if (process.env.NODE_ENV !== "production") {
  LongField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    idSchema: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.oneOfType([
      PropTypes.number,
      PropTypes.string,
      PropTypes.object,
    ]),
    required: PropTypes.bool,
    formContext: PropTypes.object.isRequired,
  };
}

LongField.defaultProps = {
  uiSchema: {}
};

export default LongField;
