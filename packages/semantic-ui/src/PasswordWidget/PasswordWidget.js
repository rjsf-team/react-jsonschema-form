/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Input } from "semantic-ui-react";
import { getSemanticProps } from "../util";

function PasswordWidget({
  id,
  required,
  readonly,
  disabled,
  label,
  name,
  value,
  onChange,
  onBlur,
  onFocus,
  autofocus,
  options,
  schema,
  formContext,
}) {
  const semanticProps = getSemanticProps({ formContext, options });
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) =>
    onChange && onChange(value === "" ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <Input
      id={id}
      key={id}
      label={label || schema.title}
      autoFocus={autofocus}
      required={required}
      disabled={disabled || readonly}
      name={name}
      {...semanticProps}
      type="password"
      value={value || ""}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}

PasswordWidget.defaultProps = {
  options: {
    semanticProps: {
      inverted: false,
      fluid: true,
    },
    errorOptions: {
      showErrors: false,
      pointing: "above",
    },
  },
};

PasswordWidget.propTypes = {
  options: PropTypes.object,
};

export default PasswordWidget;
