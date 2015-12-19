import React from "react";

import CheckboxField from "./../widgets/CheckboxWidget";

export default function BooleanField({schema, formData, required, onChange}) {
  // XXX at some point in the future we'll support other widgets for boolean
  // fields; radio buttons and selectbox mainly.
  const commonProps = {
    schema,
    onChange,
    label:    schema.title,
    formData: formData,
    required: required,
  };
  return <CheckboxField placeholder={schema.description} {...commonProps} />;
}
