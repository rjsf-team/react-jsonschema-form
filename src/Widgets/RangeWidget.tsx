import React from "react";
import { WidgetProps } from "@rjsf/core";

export default function RangeInput<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: RangeWidgetProps<T, S, F>) {
  const { id, value, readonly, disabled, onBlur, onFocus, onChange, options, schema, uiSchema, rawErrors } = props;

  const _onChange = ({ target: { value } }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(value === "" ? options.emptyValue : value);

  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, value);

  const _onFocus = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  return (
    <input
      type="range"
      id={id}
      value={value || ""}
      readOnly={readonly}
      disabled={disabled}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}