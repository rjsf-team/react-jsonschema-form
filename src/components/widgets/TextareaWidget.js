import React, {PropTypes} from "react";


function TextareaWidget({
  schema,
  id,
  placeholder,
  value,
  required,
  disabled,
  readonly,
  autofocus,
  onChange,
  onBlur,
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
      autoFocus={autofocus}
      onChange={(event) => onChange(event.target.value)}
      onBlur={(event) => {
        if (onBlur){
          onBlur(event.target.value);
        }
      }}/>
  );
}

TextareaWidget.defaultProps = {
  autofocus: false
};

if (process.env.NODE_ENV !== "production") {
  TextareaWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.string,
    required: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
  };
}

export default TextareaWidget;
