import React, { PropTypes } from "react";


function TextWidget({
  schema,
  type,
  label,
  placeholder,
  value,
  defaultValue,
  required,
  onChange
}) {
  return (
    <textarea
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
    type: PropTypes.string.isRequired,
    label: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default TextWidget;
