import React from "react";

import Form from "react-bootstrap/Form";

import { WidgetProps } from "@rjsf/core";
import { utils } from "@rjsf/core";

const { processNewValue } = utils;

const SelectWidget = ({
  schema,
  uiSchema,
  id,
  options,
  label,
  required,
  disabled,
  readonly,
  value,
  multiple,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  rawErrors = [],
}: WidgetProps) => {
  const { enumOptions, enumDisabled } = options;

  const emptyValue = multiple ? [] : "";

  function getValue(
    event: React.FocusEvent | React.ChangeEvent | any,
    multiple: Boolean
  ) {
    if (multiple) {
      return [].slice
        .call(event.target.options as any)
        .filter((o: any) => o.selected)
        .map((o: any) => o.value);
    } else {
      return event.target.value;
    }
  }

  return (
    <Form.Group>
      <Form.Label className={rawErrors.length > 0 ? "text-danger" : ""}>
        {label || schema.title}
        {(label || schema.title) && required ? "*" : null}
      </Form.Label>
      <Form.Control
        as="select"
        custom
        id={id}
        value={typeof value === "undefined" ? emptyValue : value}
        required={required}
        multiple={multiple}
        disabled={disabled}
        readOnly={readonly}
        autoFocus={autofocus}
        className={rawErrors.length > 0 ? "is-invalid" : ""}
        onBlur={
          onBlur &&
          ((event: React.FocusEvent) => {
            const newValue = getValue(event, multiple);
            onBlur(id, processNewValue({ schema, uiSchema, newValue }));
          })
        }
        onFocus={
          onFocus &&
          ((event: React.FocusEvent) => {
            const newValue = getValue(event, multiple);
            onFocus(id, processNewValue({ schema, uiSchema, newValue }));
          })
        }
        onChange={(event: React.ChangeEvent) => {
          const newValue = getValue(event, multiple);
          onChange(processNewValue({ schema, uiSchema, newValue }));
        }}>
        {!multiple && schema.default === undefined && (
          <option value="">{placeholder}</option>
        )}
        {(enumOptions as any).map(({ value, label }: any, i: number) => {
          const disabled: any =
            Array.isArray(enumDisabled) &&
            (enumDisabled as any).indexOf(value) != -1;
          return (
            <option key={i} id={label} value={value} disabled={disabled}>
              {label}
            </option>
          );
        })}
      </Form.Control>
    </Form.Group>
  );
};

export default SelectWidget;
