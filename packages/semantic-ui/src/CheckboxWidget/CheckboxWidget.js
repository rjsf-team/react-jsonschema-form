/* eslint-disable react/prop-types */
import { utils } from "@rjsf/core";
import React from "react";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";
const { getDisplayLabel } = utils;
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
  const semanticProps = getSemanticProps({ formContext, options });
  const displayLabel = getDisplayLabel(
    schema,
    uiSchema
    /* TODO: , rootSchema */
  );
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
      label={displayLabel ? label || schema.title : false}
    />
  );
}

CheckboxWidget.defaultProps = {
  options: {
    semantic: {
      inverted: false,
    },
  },
};

export default CheckboxWidget;
