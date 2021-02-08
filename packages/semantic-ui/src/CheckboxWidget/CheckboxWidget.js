/* eslint-disable react/prop-types */
import React from "react";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";
function CheckboxWidget(props) {
  const {
    id,
    value,
    required,
    disabled,
    readonly,
    label,
    autofocus,
    onChange,
    onBlur,
    options,
    onFocus,
    formContext,
    schema,
    uiSchema,
  } = props;
  const semanticProps = getSemanticProps({
    options,
    formContext,
    schema,
    uiSchema,
    defaultSchemaProps: {},
   });
   const desc = label || schema.description;
  const _onChange = (event, data) => onChange && onChange(data.checked);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const checked = value == "true" || value == true;
  return (
    <Form.Checkbox
      id={id}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      {...semanticProps}
      checked={typeof value === "undefined" ? false : checked}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      required={required}
      label={desc}
    />
  );
}
export default CheckboxWidget;
