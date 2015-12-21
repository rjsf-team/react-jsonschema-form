import React from "react";

import TextField from "./TextField";
import SelectField from "./SelectField";


export default function StringField({schema, formData, required, onChange}) {
  const commonProps = {
    schema,
    onChange,
    label:    schema.title,
    formData: formData,
    required: required,
  };
  if (Array.isArray(schema.enum)) {
    return <SelectField options={schema.enum} {...commonProps} />;
  }
  return <TextField placeholder={schema.description} {...commonProps} />;
}
