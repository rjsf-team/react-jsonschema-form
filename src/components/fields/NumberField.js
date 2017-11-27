import React from "react";
import PropTypes from "prop-types";

import { asNumber } from "../../utils";
import { registryShape } from "../../types";

function NumberField(props) {
  const { StringField } = props.registry.fields;
  return (
    <StringField
      {...props}
      onChange={value => props.onChange(asNumber(value))}
    />
  );
}

if (process.env.NODE_ENV !== "production") {
  NumberField.propTypes = {
    registry: registryShape.isRequired,
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    idSchema: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    required: PropTypes.bool,
    formContext: PropTypes.object.isRequired,
  };
}

NumberField.defaultProps = {
  uiSchema: {},
};

export default NumberField;
