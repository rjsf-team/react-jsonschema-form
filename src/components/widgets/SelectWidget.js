import React from "react";

import { defaultFieldValue } from "../../utils";
import Field from "./../fields/Field";


export default function SelectField({
  schema,
  formData,
  options,
  required,
  label,
  onChange
}) {
  return (
    <Field label={label} required={required}>
      <select
        title={schema.description}
        value={defaultFieldValue(formData, schema)}
        defaultValue={schema.default}
        onChange={(event) => onChange(event.target.value)}>{
        options.map((option, i) => {
          return <option key={i}>{option}</option>;
        })
      }</select>
    </Field>
  );
}
