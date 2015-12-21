import React from "react";

import { defaultFieldValue } from "../../utils";
import CheckboxField from "./../widgets/CheckboxWidget";

export default function BooleanField({schema, formData, required, onChange}) {
  const {title, description} = schema;
  const commonProps = {
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
