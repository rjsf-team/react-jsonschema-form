import React, { PropTypes } from "react";

import { defaultFieldValue } from "../../utils";
import TextWidget from "./../widgets/TextWidget";
import SelectWidget from "./../widgets/SelectWidget";


function StringField({schema, formData, required, onChange}) {
  const {type, title, description} = schema;
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
    // XXX uiSchema: Could also be a list of radio buttons
    return <SelectWidget options={schema.enum} {...commonProps} />;
  }
  // XXX uiSchema: Could also be a textarea for longer texts
  return <TextWidget {...commonProps} />;
}

StringField.propTypes = {
  schema: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  formData: PropTypes.string,
  required: PropTypes.bool,
};

export default StringField;
