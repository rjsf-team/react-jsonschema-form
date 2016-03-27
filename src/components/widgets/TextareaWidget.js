import React, { PropTypes } from "react";


function TextWidget({
  schema,
  id,
  placeholder,
  value,
  defaultValue,
  required,
  onChange
}) {
  return (
    <textarea
      id={id}
      className="form-control"
      value={value}
      defaultValue={defaultValue}
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
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default TextWidget;
