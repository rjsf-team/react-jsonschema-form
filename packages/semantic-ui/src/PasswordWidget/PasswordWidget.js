/* eslint-disable react/prop-types */
import { utils } from "@visma/rjsf-core";
import PropTypes from "prop-types";
import React from "react";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";
const { getDisplayLabel } = utils;
function PasswordWidget(props) {
  const {
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
    uiSchema,
    formContext,
  } = props;
  const semanticProps = getSemanticProps({ formContext, options });
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) =>
    onChange && onChange(value === "" ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const displayLabel = getDisplayLabel(
    schema,
    uiSchema
    /* TODO: , rootSchema */
  );
  return (
    <Form.Input
      id={id}
      key={id}
      label={displayLabel ? label || schema.title : false}
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
