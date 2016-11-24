import React, {PropTypes} from "react";


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
  const {inline} = options;
  var {enumOptions} = options;
  var { enumLabel,enumValue } = schema;
  if (!enumValue) {
    enumValue = "value";
  }
  if (!enumLabel) {
    enumLabel = "label";
  }  
  if (!enumOptions) {
    enumOptions = [];
  }
  return (
    <div className="field-radio-group">{
      enumOptions.map((option, i) => {
        const checked = option[enumValue] === value;
        const disabledCls = disabled ? "disabled" : "";
        const radio = (
          <span>
            <input type="radio"
              name={name}
              value={option[enumValue]}
              checked={checked}
              disabled={disabled}
              autoFocus={autofocus && i === 0}
              onChange={_ => onChange(option[enumValue])}/>
            {option[enumLabel]}
          </span>
        );

        return inline ? (
          <label key={i} className={`radio-inline ${disabledCls}`}>
            {radio}
          </label>
        ) : (
          <div key={i} className={`radio ${disabledCls}`}>
            <label>
              {radio}
            </label>
          </div>
        );
      })
    }</div>
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
