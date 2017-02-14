import React, {PropTypes} from "react";

import ClearableWidget from "./ClearableWidget";


function CheckboxWidget({
  schema,
  id,
  value,
  required,
  readonly,
  disabled,
  label,
  autofocus,
  onChange,
}) {
  return (
    <ClearableWidget
      onChange={onChange}
      disabled={disabled}
      readonly={readonly}
      value={value}>
      <div className="form-control">
        <div className={`checkbox ${disabled ? "disabled" : ""}`} style={{margin: "inherit"}}>
          <label>
            <input type="checkbox"
              id={id}
              checked={typeof value === "undefined" ? false : value}
              required={required}
              disabled={disabled}
              autoFocus={autofocus}
              onChange={(event) => onChange(event.target.checked)}/>
            <span>{label}</span>
          </label>
        </div>
      </div>
    </ClearableWidget>
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
