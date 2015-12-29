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
      <input type="text"
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
    value: PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
    ]),
    defaultValue: PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number,
    ]),
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default TextWidget;
