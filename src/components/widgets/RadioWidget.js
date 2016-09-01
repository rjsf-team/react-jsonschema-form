import React, { PropTypes } from "react";


function RadioWidget({
  schema,
  options,
  value,
  required,
  disabled,
  autoFocus,
  onChange
}) {
  // Generating a unique field name to identify this set of radio buttons
  const name = Math.random().toString();
  const {enumOptions} = options;
  return (
    <div className="field-radio-group">{
      enumOptions.map((option, i) => {
        const checked = option.value === value;
        return (
          <div key={i} className={`radio ${disabled ? "disabled" : ""}`}>
            <label>
              <input type="radio"
                name={name}
                value={option.value}
                checked={checked}
                disabled={disabled}
                autoFocus={autoFocus && i === 0}
                onChange={_ => onChange(option.value)} />
              {option.label}
            </label>
          </div>
        );
      })
    }</div>
  );
}

RadioWidget.defaultProps = {
  autoFocus: false,
};

if (process.env.NODE_ENV !== "production") {
  RadioWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    options: PropTypes.shape({
      enumOptions: PropTypes.array,
    }).isRequired,
    value: PropTypes.any,
    required: PropTypes.bool,
    autoFocus: PropTypes.bool,
    onChange: PropTypes.func,
  };
}
export default RadioWidget;
