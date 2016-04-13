import React, { PropTypes } from "react";


function TextWidget({
  schema,
  id,
  placeholder,
  value,
  required,
  onChange
}) {
  return (
    <input type="text"
      id={id}
      className="form-control"
      value={typeof value === "undefined" ? "" : value}
      placeholder={placeholder}
      required={required}
      onChange={(event) => onChange(event.target.value)} />
  );
}

if (process.env.NODE_ENV !== "production") {
  TextWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
    ]),
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default TextWidget;
