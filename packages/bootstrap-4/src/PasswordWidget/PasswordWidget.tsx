import React from "react";

import Form from "react-bootstrap/Form";

import { WidgetProps } from "@rjsf/core";

const PasswordWidget = ({
  id,
  required,
  readonly,
  disabled,
  value,
  label,
  onFocus,
  onBlur,
  onChange,
  options,
  autofocus,
  schema,
  rawErrors = [],
}: WidgetProps) => {
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
    <Form.Group  className="mb-0">
      <Form.Label className={rawErrors.length > 0 ? "text-danger" : ""}>
        {label || schema.title}
        {(label || schema.title) && required ? "*" : null}
      </Form.Label>
      <Form.Control
        id={id}
        autoFocus={autofocus}
        className={rawErrors.length > 0 ? "is-invalid" : ""}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        type="password"
        value={value ? value : ""}
        onFocus={_onFocus}
        onBlur={_onBlur}
        onChange={_onChange}
      />
    </Form.Group>
  );
};

export default PasswordWidget;
