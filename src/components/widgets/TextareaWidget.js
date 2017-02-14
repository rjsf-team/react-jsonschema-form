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
  onBlur
}) {
  const _onChange = ({target: {value}}) => {
    return onChange(value);
  };
  const _onClear = (event) => {
    event.preventDefault();
    return onChange(undefined);
  };
  return (
    <div className="input-group">
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
      <a href="#" className="input-group-addon clear-btn" title="Clear field"
        onClick={_onClear}>
        <i className="glyphicon glyphicon-remove"/>
      </a>
    </div>
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
