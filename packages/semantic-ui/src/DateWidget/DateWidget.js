/* eslint-disable react/prop-types */
import React from "react";
import { getSemanticProps } from "../util";
import { Form } from "semantic-ui-react";
import {  utils } from "@rjsf/core";

const { getDisplayLabel } = utils;
function DateWidget(props) {
  const {
    id,
    required,
    readonly,
    disabled,
    name,
    label,
    value,
    onChange,
    onBlur,
    onFocus,
    autofocus,
    options,
    formContext,
    schema,
    uiSchema,
  } = props;
  const semanticProps = getSemanticProps({ formContext, options });
  const _onChange = ({ target: { value } }) => onChange && onChange(value);
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
    type="date"
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

DateWidget.defaultProps = {
  options: {
    semantic: {
      fluid: true,
      inverted: false,
    },
  },
};

export default DateWidget;
