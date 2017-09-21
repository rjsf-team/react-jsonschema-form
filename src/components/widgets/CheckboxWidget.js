import React from "react";

import Checkbox from "material-ui/Checkbox";

function CheckboxWidget({ id, value, disabled, label, onChange }) {
  return (
    <Checkbox
      id={id}
      checked={!!value}
      disabled={disabled}
      onCheck={event => onChange(event.target.checked)}
      label={label}
    />
  );
}
export default CheckboxWidget;
