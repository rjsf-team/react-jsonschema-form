import React, { PropTypes } from "react";


function TextareaWidget({
  schema,
  id,
  placeholder,
  value,
  required,
  disabled,
  readonly,
  autoFocus,
  onChange
}) {
  return (
    <textarea
      id={id}
      className="form-control"
      value={typeof value === "undefined" ? "" : value}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      readOnly={readonly}
      autoFocus={autoFocus}
      onChange={(event) => onChange(event.target.value)} />
  );
}

TextareaWidget.defaultProps = {
  autoFocus: false
};

if (process.env.NODE_ENV !== "production") {
  TextareaWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    required: PropTypes.bool,
    autoFocus: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default TextareaWidget;
