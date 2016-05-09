import React, { PropTypes } from "react";


function RadioWidget({
  schema,
  options,
  placeholder,
  value,
  required,
  disabled,
  onChange
}) {
  // Generating a unique field name to identify this set of radio buttons
  const name = Math.random().toString();
  return (
    <div className="field-radio-group">{
      options.map((option, i) => {
        const checked = option.value === value;
        return (
          <div key={i} className={`radio ${disabled ? "disabled" : ""}`}>
            <label>
              <input type="radio"
                name={name}
                value={option.value}
                checked={checked}
                disabled={disabled}
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
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}
export default RadioWidget;
