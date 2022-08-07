import React from "react";
import { processSelectValue, WidgetProps } from "@rjsf/utils";

function getValue(
  event: React.SyntheticEvent<HTMLSelectElement>,
  multiple: boolean
) {
  if (multiple) {
    return Array.from((event.target as HTMLSelectElement).options)
      .slice()
      .filter((o) => o.selected)
      .map((o) => o.value);
  } else {
    return (event.target as HTMLSelectElement).value;
  }
}

function SelectWidget<T = any, F = any>({
  schema,
  id,
  options,
  value,
  required,
  disabled,
  readonly,
  multiple = false,
  autofocus = false,
  onChange,
  onBlur,
  onFocus,
  placeholder,
}: WidgetProps<T, F>) {
  const { enumOptions, enumDisabled } = options;
  const emptyValue = multiple ? [] : "";
  return (
    <select
      id={id}
      multiple={multiple}
      className="form-control"
      value={typeof value === "undefined" ? emptyValue : value}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onBlur={
        onBlur &&
        ((event) => {
          const newValue = getValue(event, multiple);
          onBlur(id, processSelectValue(schema, newValue));
        })
      }
      onFocus={
        onFocus &&
        ((event) => {
          const newValue = getValue(event, multiple);
          onFocus(id, processSelectValue(schema, newValue));
        })
      }
      onChange={(event) => {
        const newValue = getValue(event, multiple);
        onChange(processSelectValue(schema, newValue));
      }}
    >
      {!multiple && schema.default === undefined && (
        <option value="">{placeholder}</option>
      )}
      {Array.isArray(enumOptions) &&
        enumOptions.map(({ value, label }, i) => {
          const disabled = enumDisabled && enumDisabled.indexOf(value) != -1;
          return (
            <option key={i} value={value} disabled={disabled}>
              {label}
            </option>
          );
        })}
    </select>
  );
}

export default SelectWidget;
