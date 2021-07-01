/* eslint-disable react/prop-types */
import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";
import { utils } from '@rjsf/core';

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
  const { eventOnChange } = utils.hooks.useEmptyValueOnChange({ onChange, options, value });
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <Form.Input
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
      onChange={eventOnChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}

PasswordWidget.defaultProps = {
  options: {
    semantic: {
      inverted: false,
      fluid: true,
    },
  },
};

PasswordWidget.propTypes = {
  options: PropTypes.object,
};

export default PasswordWidget;
