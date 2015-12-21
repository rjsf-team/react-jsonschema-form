import React, { PropTypes } from "react";

import Wrapper from "./../widgets/Wrapper";


function RadioWidget({
  type,
  options,
  label,
  placeholder,
  value,
  defaultValue,
  required,
  onChange
}) {
  // Generating a unique field name to identify this set of radio buttons
  const name = Math.random().toString();
  return (
    <Wrapper type={type} label={label}>
      {
        options.map((option, i) => {
          const checked = value ? option === value :
                                  option === defaultValue;
          return (
            <div key={i}>
              <label>
                <input type="radio"
                  name={name}
                  value={option}
                  checked={checked}
                  placeholder={placeholder}
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

RadioWidget.propTypes = {
  type: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.any,
  defaultValue: PropTypes.any,
  required: PropTypes.bool,
  onChange: PropTypes.func,
};

export default RadioWidget;
