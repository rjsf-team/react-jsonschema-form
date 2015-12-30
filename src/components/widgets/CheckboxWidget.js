import React, { PropTypes } from "react";


function CheckboxWidget({
  schema,
  onChange,
  label,
  defaultValue,
  value,
  required,
  placeholder
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
    label: PropTypes.string,
    defaultValue: PropTypes.bool,
    value: PropTypes.bool,
    required: PropTypes.bool,
    placeholder: PropTypes.string,
  };
}

export default CheckboxWidget;
