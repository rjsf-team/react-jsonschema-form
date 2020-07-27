import React from "react";

import Form from "react-bootstrap/Form";

import { WidgetProps } from "@rjsf/core";
import { utils } from "@rjsf/core";

const { asNumber, guessType } = utils;

const nums = new Set(["number", "integer"]);

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
const processValue = (schema: any, value: any) => {
  // "enum" is a reserved word, so only "type" and "items" can be destructured
  const { type, items } = schema;
  if (value === "") {
    return undefined;
  } else if (type === "array" && items && nums.has(items.type)) {
    return value.map(asNumber);
  } else if (type === "boolean") {
    return value === "true";
  } else if (type === "number") {
    return asNumber(value);
  }

  // If type is undefined, but an enum is present, try and infer the type from
  // the enum values
  if (schema.enum) {
    if (schema.enum.every((x: any) => guessType(x) === "number")) {
      return asNumber(value);
    } else if (schema.enum.every((x: any) => guessType(x) === "boolean")) {
      return value === "true";
    }
  }

  return value;
};

const SelectWidget = ({
  schema,
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

  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<{ name?: string; value: unknown }>) =>
    onChange(processValue(schema, value));
  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLSelectElement>) =>
    onBlur(id, processValue(schema, value));
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLSelectElement>) =>
    onFocus(id, processValue(schema, value));

  return (
    <Form.Group controlId={id}>
      <Form.Label className={rawErrors.length > 0 ? "text-danger" : ""}>
        {label || schema.title}
        {(label || schema.title) && required ? "*" : null}
      </Form.Label>
      <Form.Control
        as="select"
        custom
        id={id}
        name={name}
        value={typeof value === "undefined" ? emptyValue : value}
        required={required}
        multiple={multiple}
        disabled={disabled}
        readOnly={readonly}
        autoFocus={autofocus}
        className={rawErrors.length > 0 ? "is-invalid" : ""}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}>
        {!multiple && schema.default === undefined && (
          <option value="">{placeholder}</option>
        )}
        {(enumOptions as any).map(({ value, label }: any, i: number) => {
          const disabled: any =
            Array.isArray(enumDisabled) &&
            (enumDisabled as any).indexOf(value) != -1;
          return (
            <option key={i} value={value} disabled={disabled}>
              {label}
            </option>
          );
        })}
      </Form.Control>
    </Form.Group>
  );
};

export default SelectWidget;
