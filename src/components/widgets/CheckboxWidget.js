import React from "react";

import { defaultFieldValue } from "../../utils";
import Field from "./../fields/Field";

export default function CheckboxField({
  schema,
  onChange,
  formData,
  label,
  required,
  placeholder
}) {
  return (
    <Field label={label} required={required} type={schema.type}>
      <input type="checkbox"
        title={placeholder}
        checked={defaultFieldValue(formData, schema)}
        defaultChecked={!!schema.default}
        required={required}
        onChange={(event) => onChange(event.target.checked)} />
    </Field>
  );
}
