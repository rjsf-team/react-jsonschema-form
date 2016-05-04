import React, { PropTypes } from "react";


function BaseInput(props) {
  const {value, readonly, onChange} = props;
  return (
    <input
      {...props}
      className="form-control"
      readOnly={readonly}
      value={typeof value === "undefined" ? "" : value}
      onChange={(event) => onChange(event.target.value)} />
  );
}

BaseInput.defaultProps = {
  type: "text",
  required: false,
  disabled: false,
  readonly: false,
};

if (process.env.NODE_ENV !== "production") {
  BaseInput.propTypes = {
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.any,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default BaseInput;
