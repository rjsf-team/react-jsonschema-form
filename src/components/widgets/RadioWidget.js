import React, { PropTypes } from "react";


function RadioWidget({
  schema,
  options,
  placeholder,
  value,
  defaultValue,
  required,
  onChange
}) {
  // Generating a unique field name to identify this set of radio buttons
  const name = Math.random().toString();
  return (
    <div className="field-radio-group">{
      options.map((option, i) => {
        const checked = value !== undefined ? option.value === value :
                                              option.value === defaultValue;
        return (
          <div key={i} className="radio">
            <label>
              <input type="radio"
                name={name}
                value={option.value}
                checked={checked}
                placeholder={placeholder}
                onChange={_ => onChange(option.value)} />
              {option.label}
            </label>
          </div>
        );
      })
    }</div>
  );
}

if (process.env.NODE_ENV !== "production") {
  RadioWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    options: PropTypes.array.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.any,
    defaultValue: PropTypes.any,
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}
export default RadioWidget;
