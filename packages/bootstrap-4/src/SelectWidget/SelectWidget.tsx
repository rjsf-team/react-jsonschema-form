import React from "react";

import Form from "react-bootstrap/Form";

import {
  FormContextType,
  processSelectValue,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";

export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  schema,
  id,
  options,
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
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled } = options;

  const emptyValue = multiple ? [] : "";

  function getValue(
    event: React.FocusEvent | React.ChangeEvent | any,
    multiple?: boolean
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
    <Form.Control
      as="select"
      bsPrefix="custom-select"
      id={id}
      name={id}
      value={typeof value === "undefined" ? emptyValue : value}
      required={required}
      multiple={multiple}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      className={rawErrors.length > 0 ? "is-invalid" : ""}
      onBlur={
        onBlur &&
        ((event: React.FocusEvent) => {
          const newValue = getValue(event, multiple);
          onBlur(id, processSelectValue<T, S, F>(schema, newValue, options));
        })
      }
      onFocus={
        onFocus &&
        ((event: React.FocusEvent) => {
          const newValue = getValue(event, multiple);
          onFocus(id, processSelectValue<T, S, F>(schema, newValue, options));
        })
      }
      onChange={(event: React.ChangeEvent) => {
        const newValue = getValue(event, multiple);
        onChange(processSelectValue<T, S, F>(schema, newValue, options));
      }}
    >
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
  );
}
