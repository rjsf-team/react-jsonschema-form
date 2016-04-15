import React, { PropTypes } from "react";


function CheckboxWidget({
  schema,
  id,
  value,
  required,
  placeholder,
  onChange,
  label,
}) {
  return (
    <div className="checkbox">
      <label>
        <input type="checkbox"
          id={id}
          title={placeholder}
          checked={typeof value === "undefined" ? false : value}
          required={required}
          onChange={(event) => onChange(event.target.checked)} />
        <strong>{label}</strong>
      </label>
    </div>
  );
}
if (process.env.NODE_ENV !== "production") {
  CheckboxWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    value: PropTypes.bool,
    required: PropTypes.bool,
    placeholder: PropTypes.string,
  };
}

export default CheckboxWidget;
