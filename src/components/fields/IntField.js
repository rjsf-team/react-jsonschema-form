import React, { PropTypes } from "react";
import bson from 'bson';
const { Int32, BSON_INT32_MAX, BSON_INT32_MIN } = bson;

import { isInteger } from "../../utils";
import StringField from "./StringField";

function convert (value) {
  if (!isInteger(value)) {
    return value;
  }

  const number = Number(value);
  const isOutOfRange = number < BSON_INT32_MIN || number > BSON_INT32_MAX;
  if (isOutOfRange) {
    return value;
  }

  return new Int32(number);
}

function IntField(props) {
  return (
    <StringField {...props}
      onChange={(value) => props.onChange(convert(value))} />
  );
}

if (process.env.NODE_ENV !== "production") {
  IntField.propTypes = {
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

IntField.defaultProps = {
  uiSchema: {}
};

export default IntField;
