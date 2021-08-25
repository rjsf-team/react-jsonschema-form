import React from "react";
import PropTypes from "prop-types";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";
import {  utils } from "@rjsf/core";

const { getDisplayLabel } = utils;
function EmailWidget(props) {
  const {
    id,
    required,
    readonly,
    disabled,
    name,
    label,
    schema,
    uiSchema,
    value,
    onChange,
    onBlur,
    onFocus,
    autofocus,
    options,
    formContext,
  } = props;
  const semanticProps = getSemanticProps({ formContext, options });
  // eslint-disable-next-line no-shadow
  const _onChange = ({ target: { value } }) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const displayLabel = getDisplayLabel(
    schema,
    uiSchema
    /* TODO: , rootSchema */
  );
  return (
    <Form.Input
      key={id}
      id={id}
      type="email"
      label={displayLabel ? label || schema.title : false}
      required={required}
      autoFocus={autofocus}
      disabled={disabled || readonly}
      name={name}
      {...semanticProps}
      value={value || value === 0 ? value : ""}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}

EmailWidget.defaultProps = {
  options: {
    semantic: {
      fluid: true,
      inverted: false,
    },
  },
};




EmailWidget.defaultProps = {
  options: {
    semantic: {
      fluid: true,
      inverted: false,
    },
  },
};


EmailWidget.propTypes = {
  options: PropTypes.object,
};

export default EmailWidget;
