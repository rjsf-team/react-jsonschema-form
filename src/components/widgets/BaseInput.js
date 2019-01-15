import React from "react";
import PropTypes from "prop-types";
import styled from "@emotion/styled";

const Input = styled.input`
  border: 1px solid ${props => props.theme.borderColor}; 
  &:hover, &:focus {
    border-color: ${props => props.theme.activeColor};
  };
  display: block;
  width: 100%;
  height: 40px;
  padding: 6px 12px;
  font-size: 14px;
  line-height: 1.42857143;
  color: #555;
  background-color: #fff;
  background-image: none; 
  border-radius: 0px;
  outline: none;
  `;

function BaseInput(props) {
  // Note: since React 15.2.0 we can't forward unknown element attributes, so we
  // exclude the "options" and "schema" ones here.
  if (!props.id) {
    console.log("No id for", props);
    throw new Error(`no id for props ${JSON.stringify(props)}`);
  }

  const {
    value,
    readonly,
    disabled,
    autofocus,
    onBlur,
    onFocus,
    options,
    schema,
    formContext,
    registry,
    rawErrors,
    ...inputProps
  } = props;

  inputProps.type = options.inputType || inputProps.type || "text";
  const _onChange = ({ target: { value } }) => {
    return props.onChange(value === "" ? options.emptyValue : value);
  };

  return (
    <Input
      className="form-control"
      readOnly={readonly}
      disabled={disabled}
      autoFocus={autofocus}
      value={value == null ? "" : value}
      {...inputProps}
      onChange={_onChange}
      onBlur={onBlur && (event => onBlur(inputProps.id, event.target.value))}
      onFocus={onFocus && (event => onFocus(inputProps.id, event.target.value))}
    />
  );
}

BaseInput.defaultProps = {
  type: "text",
  required: false,
  disabled: false,
  readonly: false,
  autofocus: false
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
    onBlur: PropTypes.func,
    onFocus: PropTypes.func
  };
}

export default BaseInput;
