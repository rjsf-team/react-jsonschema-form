import React from "react";
import { RadioButton, RadioButtonGroup } from "material-ui/RadioButton";

function RadioWidget({ options, value, disabled, label, onChange }) {
  // Generating a unique field name to identify this set of radio buttons
  const name = Math.random().toString();
  const { enumOptions } = options;
  return (
    <RadioButtonGroup
      name={name}
      defaultSelected={value}
      onChange={(event, value) => onChange(value)}>
      {enumOptions.map((option, i) => {
        return (
          <RadioButton
            key={i}
            name={name}
            value={option.value}
            disabled={disabled}
            label={option.label}
          />
        );
      })}
    </RadioButtonGroup>
  );
}

export default RadioWidget;
