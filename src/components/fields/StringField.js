import React from "react";

import { defaultFieldValue } from "../../utils";
import TextWidget from "./../widgets/TextWidget";
import SelectWidget from "./../widgets/SelectWidget";


export default function StringField({schema, formData, required, onChange}) {
  const {type, title, description} = schema;
  const commonProps = {
    type: type,
    label: title,
    placeholder: description,
    onChange,
    value: formData,
    required: required,
    defaultValue: defaultFieldValue(formData, schema),
  };
  if (Array.isArray(schema.enum)) {
    // XXX uiSchema: Could also be a list of radio buttons
    return <SelectWidget options={schema.enum} {...commonProps} />;
  }
  // XXX uiSchema: Could also be a textarea for longer texts
  return <TextWidget {...commonProps} />;
}
