import React, { PropTypes } from "react";


function PasswordWidget({
  schema,
  placeholder,
  value,
  defaultValue,
  required,
  onChange
}) {
  return (
    <input type="password"
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      required={required}
      onChange={(event) => onChange(event.target.value)} />
  );
}

if (process.env.NODE_ENV !== "production") {
  PasswordWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
    ]),
    defaultValue: PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
    ]),
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default PasswordWidget;
