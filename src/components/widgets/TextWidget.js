import React from "react";

import { defaultFieldValue } from "../../utils";
import Wrapper from "./../widgets/Wrapper";


export default function TextWidget({
  schema,
  formData,
  label,
  required,
  placeholder,
  onChange
}) {
  return (
    <Wrapper label={label} required={required}
      type={schema.type}>
      <input type="text"
        value={defaultFieldValue(formData, schema)}
        defaultValue={schema.default}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)} />
    </Wrapper>
  );
}
