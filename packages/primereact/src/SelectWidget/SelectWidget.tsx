import { utils, WidgetProps } from "@rjsf/core";
import cn from "clsx";
import { Dropdown, DropdownChangeParams } from "primereact/dropdown";
import React from "react";
import { MultiSelect, MultiSelectChangeParams } from "primereact/multiselect";

const { asNumber, guessType } = utils;

const nums = new Set(["number", "integer"]);

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
const processValue = (schema: any, value: any): number | number[] | boolean | boolean[] | undefined | unknown => {
  // "enum" is a reserved word, so only "type" and "items" can be destructured
  const { type, items } = schema;
  if (value === "") {
    return undefined;
  }
  if (type === "array" && items && nums.has(items.type)) {
    return value.map(asNumber);
  }
  if (type === "boolean") {
    return value === "true";
  }
  if (type === "number") {
    return asNumber(value);
  }

  // If type is undefined, but an enum is present, try and infer the type from
  // the enum values
  if (schema.enum) {
    if (schema.enum.every((x: any) => guessType(x) === "number")) {
      return asNumber(value);
    }
    if (schema.enum.every((x: any) => guessType(x) === "boolean")) {
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

  type Option = { label: string; value: any; disabled: boolean };
  const optionsList = (enumOptions as any[]).map(({ label, value }: { label: string; value: any }): Option => {
    const disabled = Array.isArray(enumDisabled) && enumDisabled.includes(value);
    return {
      label,
      value,
      disabled,
    };
  });

  const getValue = (event: MultiSelectChangeParams | DropdownChangeParams) => {
    if (multiple) {
      const value: any[] = Array.isArray((event as MultiSelectChangeParams).value) ?
        (event as MultiSelectChangeParams).value :
        [(event as MultiSelectChangeParams).value];
      return value.map((o: any) => o.value);
    }
    return (event as DropdownChangeParams).value;
  }
  const labelValue = label || schema.title;

  return (
    <div className="mb-2">
      {labelValue && (
        <label htmlFor={id} className={cn("block mb-1", rawErrors.length > 0 && "text-color-danger")}>
          {labelValue}
          {required ? "*" : null}
        </label>
      )}
      {multiple ? (
        <MultiSelect
          id={id}
          value={typeof value === "undefined" ? emptyValue : value}
          options={optionsList}
          disabled={disabled}
          placeholder={placeholder}
          className={rawErrors.length > 0 ? "is-invalid" : ""}
          onBlur={
            onBlur &&
            (() => {
              onBlur(id, processValue(schema, value));
            })
          }
          onFocus={
            onFocus &&
            (() => {
              onFocus(id, processValue(schema, value));
            })
          }
          onChange={(event) => {
            onChange(processValue(schema, getValue(event)));
          }}
        />
      ) : (
        <Dropdown
          id={id}
          value={typeof value === "undefined" ? emptyValue : value}
          options={optionsList}
          required={required}
          disabled={disabled}
          autoFocus={autofocus}
          placeholder={placeholder}
          className={rawErrors.length > 0 ? "is-invalid" : ""}
          onBlur={
            onBlur &&
            (() => {
              onBlur(id, processValue(schema, value));
            })
          }
          onFocus={
            onFocus &&
            (() => {
              onFocus(id, processValue(schema, value));
            })
          }
          onChange={(event) => {
            onChange(processValue(schema, getValue(event)));
          }}
        />
      )}
    </div>
  );
};

export default SelectWidget;
