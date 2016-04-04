import React, { PropTypes } from "react";


function DateTimeWidget({
  schema,
  id,
  placeholder,
  value,
  defaultValue,
  required,
  onChange
}) {
  return (
    <input type="datetime"
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
  DateTimeWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: React.PropTypes.string,
    defaultValue: React.PropTypes.string,
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default DateTimeWidget;
