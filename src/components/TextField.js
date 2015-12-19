import React from "react";

import { defaultFieldValue } from "../utils";
import Field from "./Field";


export default function TextField({
  schema,
  formData,
  label,
  required,
  placeholder,
  onChange
}) {
  return (
    <Field label={label} required={required}
      type={schema.type}>
      <input type="text"
        value={defaultFieldValue(formData, schema)}
        defaultValue={schema.default}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)} />
    </Field>
  );
}
