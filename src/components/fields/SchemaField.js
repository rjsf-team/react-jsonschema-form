import React, { PropTypes } from "react";

import StringField from "./StringField";
import ArrayField from "./ArrayField";
import BooleanField from "./BooleanField";
import ObjectField from "./ObjectField";
import UnsupportedField from "./UnsupportedField";


const COMPONENT_TYPES = {
  "string":    StringField,
  "array":     ArrayField,
  "boolean":   BooleanField,
  "object":    ObjectField,
  "date-time": StringField,
  "number":    StringField,
};

function SchemaField(props) {
  const FieldComponent = COMPONENT_TYPES[props.schema.type] || UnsupportedField;
  return <FieldComponent {...props} />;
}

SchemaField.propTypes = {
  schema: PropTypes.object.isRequired
};

export default SchemaField;
