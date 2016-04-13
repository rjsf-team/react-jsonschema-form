import React, { PropTypes } from "react";


function URLWidget({
  schema,
  id,
  placeholder,
  value,
  required,
  onChange
}) {
  return (
    <input type="url"
      id={id}
      className="form-control"
      value={typeof value === "undefined" ? "" : value}
      placeholder={placeholder}
      required={required}
      onChange={(event) => onChange(event.target.value)} />
  );
}

if (process.env.NODE_ENV !== "production") {
  URLWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: React.PropTypes.string,
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default URLWidget;
