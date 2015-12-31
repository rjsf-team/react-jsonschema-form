import React, { PropTypes } from "react";


function CheckboxWidget({
  schema,
  defaultValue,
  value,
  required,
  placeholder,
  onChange,
}) {
  return (
    <input type="checkbox"
      title={placeholder}
      checked={value}
      defaultChecked={defaultValue}
      required={required}
      onChange={(event) => onChange(event.target.checked)} />
  );
}
if (process.env.NODE_ENV !== "production") {
  CheckboxWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    defaultValue: PropTypes.bool,
    value: PropTypes.bool,
    required: PropTypes.bool,
    placeholder: PropTypes.string,
  };
}

export default CheckboxWidget;
