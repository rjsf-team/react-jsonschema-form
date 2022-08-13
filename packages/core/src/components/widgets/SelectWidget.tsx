import { ChangeEvent, FocusEvent } from "react";
import * as React from "react";
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
  }
  return (event.target as HTMLSelectElement).value;
}

/** The `SelectWidget` is a widget for rendering dropdowns.
 *  It is typically used with string properties constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
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

  const handleFocus = (event: FocusEvent<HTMLSelectElement>) => {
    const newValue = getValue(event, multiple);
    return onFocus(id, processSelectValue(schema, newValue));
  };

  const handleBlur = (event: FocusEvent<HTMLSelectElement>) => {
    const newValue = getValue(event, multiple);
    return onBlur(id, processSelectValue(schema, newValue));
  };

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newValue = getValue(event, multiple);
    return onChange(processSelectValue(schema, newValue));
  };

  return (
    <select
      id={id}
      multiple={multiple}
      className="form-control"
      value={typeof value === "undefined" ? emptyValue : value}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onChange={handleChange}
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
