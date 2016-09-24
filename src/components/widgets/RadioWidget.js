import React, { PropTypes } from "react";


function RadioWidget({
  schema,
  options,
  value,
  required,
  disabled,
  onChange,
  optionStyle = {groupStyle: {}, inputStyle: {}},
  optionClassName = "radio",
}) {
  // Generating a unique field name to identify this set of radio buttons
  const name = Math.random().toString();
  const {enumOptions} = options;
  const {groupStyle, inputStyle} = optionStyle;
  return (
    <div className="field-radio-group" style={groupStyle}>{
      enumOptions.map((option, i) => {
        const checked = option.value === value;
        return (
          <span key={i} className={`${optionClassName} ${disabled ? "disabled" : ""}`}>
            <label>
              <input type="radio"
                style={inputStyle}
                name={name}
                value={option.value}
                checked={checked}
                disabled={disabled}
                onChange={_ => onChange(option.value)} />
              {option.label}
            </label>
          </span>
        );
      })
    }</div>
  );
}

if (process.env.NODE_ENV !== "production") {
  RadioWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    options: PropTypes.shape({
      enumOptions: PropTypes.array,
    }).isRequired,
    value: PropTypes.any,
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}
export default RadioWidget;
