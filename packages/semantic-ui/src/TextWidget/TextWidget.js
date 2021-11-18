/* eslint-disable react/prop-types */
import React from "react";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";
import {  utils } from "@rjsf/core";
const { getDisplayLabel } = utils;
function TextWidget(props) {
  const {
    id,
    placeholder,
    name,
    label,
    value,
    required,
    readonly,
    disabled,
    onChange,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    uiSchema,
    formContext,
  } = props;
  const semanticProps = getSemanticProps(
    { formContext,
      options,
      uiSchema,
  });
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
      placeholder={placeholder}
      type={schema.type === 'string' ?  'text' : `${schema.type}`}
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
export default TextWidget;
