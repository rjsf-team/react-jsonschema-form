import React, {PropTypes} from "react";

import ClearableWidget from "./ClearableWidget";


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
  onBlur
}) {
  const _onChange = ({target: {value}}) => {
    return onChange(value);
  };
  return (
    <ClearableWidget
      onChange={onChange}
      disabled={disabled}
      readonly={readonly}
      value={value}>
      <textarea
        id={id}
        className="form-control"
        value={typeof value === "undefined" ? "" : value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        autoFocus={autofocus}
        onBlur={onBlur && (event => onBlur(id, event.target.value))}
        onChange={_onChange}/>
    </ClearableWidget>
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
