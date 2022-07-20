/* eslint-disable react/prop-types */
import React from "react";
import { Form } from "semantic-ui-react";
import { getSemanticProps } from "../util";

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
    registry,
  } = props;
  const semanticProps = getSemanticProps({
    uiSchema,
    schema,
    formContext,
    options,
  });
  const { schemaUtils } = registry;
  const _onChange = ({ target: { value } }) => onChange && onChange(value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  const displayLabel = schemaUtils.getDisplayLabel(schema, uiSchema);
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
export default DateWidget;
