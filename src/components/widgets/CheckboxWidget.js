import React, {PropTypes} from "react";
import DescriptionField from "../fields/DescriptionField.js";

function CheckboxWidget({
  schema,
  id,
  value,
  required,
  disabled,
  label,
  autofocus,
  onChange,
}) {
  return (
    <div className={`checkbox ${disabled ? "disabled" : ""}`}>
      { schema.description
        ? <DescriptionField description={ schema.description }/>
        : null
      }
      <label>
        <input type="checkbox"
          id={id}
          checked={typeof value === "undefined" ? false : value}
          required={required}
          disabled={disabled}
          autoFocus={autofocus}
          title={schema.description}
          onChange={(event) => onChange(event.target.checked)}/>
        <span>{label}</span>
      </label>
    </div>
  );
}

CheckboxWidget.defaultProps = {
  autofocus: false,
};

if (process.env.NODE_ENV !== "production") {
  CheckboxWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    value: PropTypes.bool,
    required: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default CheckboxWidget;
