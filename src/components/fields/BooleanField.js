import React, { PropTypes } from "react";

import { defaultFieldValue, getAlternativeWidget } from "../../utils";
import CheckboxField from "./../widgets/CheckboxWidget";

function BooleanField({schema, name, uiSchema, formData, required, onChange}) {
  const {title, description} = schema;
  const {widget} = uiSchema;
  const commonProps = {
    type: schema.type,
    onChange,
    label: title || name,
    placeholder: description,
    defaultValue: schema.default,
    value: defaultFieldValue(formData, schema),
    required,
  };
  if (widget) {
    const Widget = getAlternativeWidget(widget);
    return <Widget options={[true, false]} {... commonProps} />;
  }
  return <CheckboxField {...commonProps} />;
}

if (process.env.NODE_ENV !== "production") {
  BooleanField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.bool,
    required: PropTypes.bool,
  };
}

BooleanField.defaultProps = {
  uiSchema: {}
};

export default BooleanField;
