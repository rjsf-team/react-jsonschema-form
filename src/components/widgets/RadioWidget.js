import React from "react";

import Field from "./../fields/Field";


export default function RadioField({schema, formData, options, onChange}) {
  // Generating a unique field name to identify this set of radio buttons
  const name = Math.random().toString();
  return (
    <Field type={schema.type} label={schema.title}>
      {
        options.map((option, i) => {
          const checked = formData ? option === formData :
                                     option === schema.default;
          return (
            <div>
              <label>
                <input type="radio"
                  name={name}
                  value={option}
                  checked={checked}
                  onChange={_ => onChange(option)} />
                {option}
              </label>
            </div>
          );
        })
      }
    </Field>
  );
}
