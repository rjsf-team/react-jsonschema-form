import React from "react";

import Wrapper from "./../widgets/Wrapper";


export default function RadioWidget({schema, formData, options, onChange}) {
  // Generating a unique field name to identify this set of radio buttons
  const name = Math.random().toString();
  return (
    <Wrapper type={schema.type} label={schema.title}>
      {
        options.map((option, i) => {
          const checked = formData ? option === formData :
                                     option === schema.default;
          return (
            <div key={i}>
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
    </Wrapper>
  );
}
