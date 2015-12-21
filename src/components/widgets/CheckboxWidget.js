import React, { PropTypes } from "react";

import Wrapper from "./../widgets/Wrapper";

function CheckboxWidget({
  onChange,
  label,
  defaultValue,
  value,
  required,
  placeholder
}) {
  return (
    <Wrapper label={label} required={required} type="boolean">
      <input type="checkbox"
        title={placeholder}
        checked={value}
        defaultChecked={defaultValue}
        required={required}
        onChange={(event) => onChange(event.target.checked)} />
    </Wrapper>
  );
}

CheckboxWidget.propTypes = {
  onChange: PropTypes.func,
  label: PropTypes.string,
  defaultValue: PropTypes.bool,
  value: PropTypes.bool,
  required: PropTypes.bool,
  placeholder: PropTypes.string,
};

export default CheckboxWidget;
