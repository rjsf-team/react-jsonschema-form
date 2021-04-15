import React from "react";

import Form from "react-bootstrap/Form";

import { WidgetProps } from "@rjsf/core";

const UpDownWidget = ({
  id,
  required,
  readonly,
  disabled,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  autofocus,
}: WidgetProps) => {
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) => onChange(value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  return (
    <Form.Group  className="mb-0">
      <Form.Label>
        {label}
        {label && required ? "*" : null}
      </Form.Label>
      <Form.Control
        id={id}
        autoFocus={autofocus}
        required={required}
        type="number"
        disabled={disabled}
        readOnly={readonly}
        value={value || value === 0 ? value : ""}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
    </Form.Group>
  );
};

export default UpDownWidget;
