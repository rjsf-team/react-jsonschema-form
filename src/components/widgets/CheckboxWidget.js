import React, {PropTypes} from "react";

import FormGroup from "react-bootstrap/lib/FormGroup";
import Checkbox from "react-bootstrap/lib/Checkbox";

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
    <FormGroup>
      <Checkbox type="checkbox"
        id={id}
        checked={typeof value === "undefined" ? false : value}
        required={required}
        disabled={disabled}
        autoFocus={autofocus}
        onChange={(event) => onChange(event.target.checked)}>
        {label}
      </Checkbox>
    </FormGroup>
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
