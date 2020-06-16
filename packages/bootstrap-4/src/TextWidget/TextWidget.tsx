import React from "react";

import Form from "react-bootstrap/Form";

import { WidgetProps } from "@rjsf/core";

export type TextWidgetProps = WidgetProps;

const TextWidget = ({
  id,
  required,
  readonly,
  disabled,
  type,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  autofocus,
  options,
  schema,
  rawErrors = [],
  formContext,
  ...textFieldProps
}: TextWidgetProps) => {
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  return (
    <Form.Group controlId={id}>
      <Form.Label>
        {label || schema.title}
        {required ? "*" : null}
      </Form.Label>
      <Form.Control
        id={id}
        autoFocus={autofocus}
        required={required}
        disabled={disabled || readonly}
        name={name}
        type={type || (schema.type as string)}
        value={value || value === 0 ? value : ""}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        {...textFieldProps}
      />
    </Form.Group>
  );
};

export default TextWidget;
