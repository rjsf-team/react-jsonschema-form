import React, { PropTypes } from "react";

import Wrapper from "./Wrapper";
import ArrayField from "./ArrayField";
import BooleanField from "./BooleanField";
import NumberField from "./NumberField";
import ObjectField from "./ObjectField";
import StringField from "./StringField";
import UnsupportedField from "./UnsupportedField";


const COMPONENT_TYPES = {
  "array":     ArrayField,
  "boolean":   BooleanField,
  "date-time": StringField,
  "integer":   NumberField,
  "number":    NumberField,
  "object":    ObjectField,
  "string":    StringField,
};

function SchemaField(props) {
  const {schema, name, required} = props;
  const FieldComponent = COMPONENT_TYPES[schema.type] || UnsupportedField;
  return (
    <Wrapper
      label={schema.title || name}
      required={required}
      type={schema.type}>
      <FieldComponent {...props} />
    </Wrapper>
  );
}

if (process.env.NODE_ENV !== "production") {
  SchemaField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
  };
}

export default SchemaField;
