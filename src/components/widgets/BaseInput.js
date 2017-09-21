import React, { PropTypes } from "react";

import TextField from "material-ui/TextField";

function BaseInput(props) {
  const {
    id,
    type,
    multiLine,
    placeholder,
    value,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
  } = props;
  return (
    <TextField
      id={id}
      type={type}
      multiLine={multiLine}
      value={typeof value === "undefined" ? "" : value}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      readOnly={readonly}
      autoFocus={autofocus}
      onChange={(event, value) => onChange(value)}
    />
  );
}

BaseInput.defaultProps = {
  type: "text",
  multiLine: false,
  required: false,
  disabled: false,
  readonly: false,
  autofocus: false,
};

if (process.env.NODE_ENV !== "production") {
  BaseInput.propTypes = {
    id: PropTypes.string.isRequired,
    multiLine: PropTypes.bool,
    value: PropTypes.any,
    placeholder: PropTypes.string,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default BaseInput;
