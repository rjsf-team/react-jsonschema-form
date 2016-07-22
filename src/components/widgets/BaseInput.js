import React, { PropTypes } from "react";


function BaseInput(props) {
  // Note: since React 15.2.0 we can't forward unknown element attributes, so we
  // exclude the "options" and "schema" ones here.
  const {
    value,
    readonly,
    autoFocus,
    onChange,
    options,  // eslint-disable-line
    schema,   // eslint-disable-line
    formContext,  // eslint-disable-line
    ...inputProps
  } = props;
  return (
    <input
      {...inputProps}
      className="form-control"
      readOnly={readonly}
      autoFocus={autoFocus}
      value={typeof value === "undefined" ? "" : value}
      onChange={(event) => onChange(event.target.value)} />
  );
}

BaseInput.defaultProps = {
  type: "text",
  required: false,
  disabled: false,
  readonly: false,
  autoFocus: false,
};

if (process.env.NODE_ENV !== "production") {
  BaseInput.propTypes = {
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.any,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autoFocus: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default BaseInput;
