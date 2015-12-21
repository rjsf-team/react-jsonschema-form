import React from "react";

import { defaultFieldValue } from "../../utils";
import Wrapper from "./../widgets/Wrapper";


export default function SelectWidget({
  schema,
  formData,
  options,
  required,
  label,
  onChange
}) {
  return (
    <Wrapper label={label} required={required}>
      <select
        title={schema.description}
        value={defaultFieldValue(formData, schema)}
        defaultValue={schema.default}
        onChange={(event) => onChange(event.target.value)}>{
        options.map((option, i) => {
          return <option key={i}>{option}</option>;
        })
      }</select>
    </Wrapper>
  );
}
