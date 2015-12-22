import React, { PropTypes } from "react";

import { defaultFieldValue, getAlternativeWidget } from "../../utils";
import TextWidget from "./../widgets/TextWidget";
import SelectWidget from "./../widgets/SelectWidget";


function StringField({schema, uiSchema, formData, required, onChange}) {
  const {type, title, description} = schema;
  const {widget} = uiSchema;
  const commonProps = {
    type: type,
    label: title,
    placeholder: description,
    onChange,
    value: defaultFieldValue(formData, schema),
    required: required,
    defaultValue: schema.default,
  };
  if (Array.isArray(schema.enum)) {
    if (widget) {
      const Widget = getAlternativeWidget(widget);
      return <Widget options={schema.enum} {...commonProps} />;
    }
    return <SelectWidget options={schema.enum} {...commonProps} />;
  }
  if (widget) {
    const Widget = getAlternativeWidget(widget);
    return <Widget {...commonProps} />;
  }
  return <TextWidget {...commonProps} />;
}

if (process.env.NODE_ENV !== "production") {
  StringField.propTypes = {
    schema: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    formData: PropTypes.string,
    required: PropTypes.bool,
  };
}

StringField.defaultProps = {
  uiSchema: {}
};

export default StringField;
