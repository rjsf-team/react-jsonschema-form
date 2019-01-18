import React from "react";

import * as types from "../../types";
import { asNumber } from "../../utils";

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
  NumberField.propTypes = types.fieldProps;
}

NumberField.defaultProps = {
  uiSchema: {},
};

export default NumberField;
