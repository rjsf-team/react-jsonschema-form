import React from "react";

import { defaultFieldValue } from "../../utils";
import Wrapper from "./../widgets/Wrapper";

export default function CheckboxWidget({
  schema,
  onChange,
  formData,
  label,
  required,
  placeholder
}) {
  return (
    <Wrapper label={label} required={required} type={schema.type}>
      <input type="checkbox"
        title={placeholder}
        checked={defaultFieldValue(formData, schema)}
        defaultChecked={!!schema.default}
        required={required}
        onChange={(event) => onChange(event.target.checked)} />
    </Wrapper>
  );
}
