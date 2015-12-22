import React, { PropTypes } from "react";

import Wrapper from "./../widgets/Wrapper";


function TextWidget({
  type,
  label,
  placeholder,
  value,
  defaultValue,
  required,
  onChange
}) {
  return (
    <Wrapper label={label} required={required} type={type}>
      <textarea
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        onChange={(event) => onChange(event.target.value)} />
    </Wrapper>
  );
}

if (process.env.NODE_ENV !== "production") {
  TextWidget.propTypes = {
    type: PropTypes.string.isRequired,
    label: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    defaultValue: PropTypes.string,
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default TextWidget;
