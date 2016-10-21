import React, { PropTypes } from "react";

import { FormGroup, Radio } from "react-bootstrap";

function RadioWidget({
  schema,
  options,
  value,
  required,
  disabled,
  autofocus,
  onChange
}) {
  // Generating a unique field name to identify this set of radio buttons
  const name = Math.random().toString();
  const { enumOptions, inline } = options;
  return (
    <FormGroup className="radio-group">{
      enumOptions.map((option, i) => {
        const checked = option.value === value;
        return (
          <Radio
            key={i}
            name={name}
            value={option.value}
            checked={checked}
            disabled={disabled}
            inline={inline}
            autoFocus={autofocus && i === 0}
            onChange={_ => onChange(option.value)}
          >
            {option.label}
          </Radio>
        );
      })
    }</FormGroup>
  );
}

RadioWidget.defaultProps = {
  autofocus: false,
};

if (process.env.NODE_ENV !== "production") {
  RadioWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    options: PropTypes.shape({
      enumOptions: PropTypes.array,
      inline: PropTypes.bool,
    }).isRequired,
    value: PropTypes.any,
    required: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
  };
}
export default RadioWidget;
