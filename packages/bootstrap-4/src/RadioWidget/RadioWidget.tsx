import React from "react";

import Form from "react-bootstrap/Form";

import { WidgetProps } from "@rjsf/core";

const RadioWidget = ({
  id,
  schema,
  options,
  value,
  required,
  disabled,
  readonly,
  label,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps) => {
  const { enumOptions, enumDisabled } = options;

  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(schema.type == "boolean" ? value !== "false" : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const inline = options.inline !== null ? options.inline : false;

  return (
    <Form.Group controlId={id} className="mb-0">
      <Form.Label className="d-block">{label || schema.title}</Form.Label>
      {(enumOptions as any).map((option: any, i: number) => {
        const itemDisabled =
          enumDisabled && (enumDisabled as any).indexOf(option.value) != -1;
        const checked = option.value === value;
        const radio = (
          <Form.Check
            inline={inline as boolean}
            label={`${option.label}`}
            key={i}
            type="radio"
            disabled={disabled || itemDisabled || readonly}
            checked={checked}
            required={required}
            value={option.value}
            onChange={_onChange}
            onBlur={_onBlur}
            onFocus={_onFocus}
          />
        );
        return radio;
      })}
    </Form.Group>
  );
};

export default RadioWidget;
