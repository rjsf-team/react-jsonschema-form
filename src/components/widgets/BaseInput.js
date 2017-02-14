import React, {PropTypes} from "react";

import ClearableWidget from "./ClearableWidget";


function BaseInput(props) {
  // Note: since React 15.2.0 we can't forward unknown element attributes, so we
  // exclude the "options" and "schema" ones here.
  const {
    value,
    readonly,
    autofocus,
    onBlur,
    options,  // eslint-disable-line
    schema,   // eslint-disable-line
    formContext,  // eslint-disable-line
    registry, // eslint-disable-line
    ...inputProps
  } = props;
  const _onChange = ({target: {value}}) => {
    return props.onChange(value);
  };
  return (
    <ClearableWidget onChange={props.onChange}>
      <input
      {...inputProps}
      className="form-control"
      readOnly={readonly}
      autoFocus={autofocus}
      value={typeof value === "undefined" ? "" : value}
      onChange={_onChange}
      onBlur={onBlur && (event => onBlur(inputProps.id, event.target.value))}/>
    </ClearableWidget>
  );
}

BaseInput.defaultProps = {
  type: "text",
  required: false,
  disabled: false,
  readonly: false,
  autofocus: false,
};

if (process.env.NODE_ENV !== "production") {
  BaseInput.propTypes = {
    id: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    value: PropTypes.any,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
    onBlur: PropTypes.func
  };
}

export default BaseInput;
