import React, { PropTypes } from "react";


function CheckboxWidget({
  schema,
  id,
  defaultValue,
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
          checked={value}
          defaultChecked={defaultValue}
          required={required}
          onChange={(event) => onChange(event.target.checked)} />
        {label}
      </label>
    </div>
  );
}
if (process.env.NODE_ENV !== "production") {
  CheckboxWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    onChange: PropTypes.func,
    defaultValue: PropTypes.bool,
    value: PropTypes.bool,
    required: PropTypes.bool,
    placeholder: PropTypes.string,
  };
}

export default CheckboxWidget;
