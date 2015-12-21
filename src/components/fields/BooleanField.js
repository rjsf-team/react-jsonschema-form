import React, { PropTypes } from "react";

import { defaultFieldValue } from "../../utils";
import CheckboxField from "./../widgets/CheckboxWidget";

function BooleanField({schema, formData, required, onChange}) {
  const {title, description} = schema;
  const commonProps = {
    type: schema.type,
    onChange,
    label: title,
    placeholder: description,
    defaultValue: schema.default,
    value: defaultFieldValue(formData, schema),
    required,
  };
  // XXX handle uiSchema.widget here
  return <CheckboxField {...commonProps} />;
}

BooleanField.propTypes = {
  schema: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  formData: PropTypes.bool,
  required: PropTypes.bool,
};

export default BooleanField;
