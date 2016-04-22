import React, { PropTypes } from "react";


function fromJSONDate(jsonDate) {
  return jsonDate ? jsonDate.slice(0, 19) : "";
}

function toJSONDate(dateString) {
  if (dateString) {
    return new Date(dateString).toJSON();
  }
}

function DateTimeWidget({
  schema,
  id,
  value,
  required,
  onChange
}) {
  return (
    <input type="datetime-local"
      id={id}
      className="form-control"
      value={fromJSONDate(value)}
      required={required}
      onChange={(event) => onChange(toJSONDate(event.target.value))} />
  );
}

if (process.env.NODE_ENV !== "production") {
  DateTimeWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default DateTimeWidget;
