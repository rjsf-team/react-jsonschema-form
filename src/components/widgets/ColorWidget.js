import React, { PropTypes } from "react";


function ColorWidget({
  schema,
  id,
  placeholder,
  value,
  required,
  disabled,
  readonly,
  onChange
}) {
  return (
    <input type="color"
      id={id}
      className="form-control"
      value={typeof value === "undefined" ? "" : value}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      readOnly={readonly}
      onChange={(event) => onChange(event.target.value)} />
  );
}

if (process.env.NODE_ENV !== "production") {
  ColorWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    value: React.PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default ColorWidget;
