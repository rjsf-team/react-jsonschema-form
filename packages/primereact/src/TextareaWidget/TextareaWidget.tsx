import { WidgetProps } from "@rjsf/core";
import React from "react";
import { InputTextarea } from "primereact/inputtextarea";
import cn from "clsx";

type CustomWidgetProps = WidgetProps & {
  options: any;
};

const TextareaWidget = ({
  id,
  placeholder,
  value,
  required,
  disabled,
  autofocus,
  label,
  readonly,
  onBlur,
  onFocus,
  onChange,
  options,
  schema,
  rawErrors = [],
  uiSchema,
}: CustomWidgetProps) => {
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLTextAreaElement>) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLTextAreaElement>) => onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLTextAreaElement>) => onFocus(id, value);

  return (
    <>
      <label htmlFor={id} className={cn("block", rawErrors.length > 0 ? "text-color-danger" : undefined)}>
        {uiSchema["ui:title"] || schema.title || label}
        {(label || uiSchema["ui:title"] || schema.title) && required ? "*" : null}
      </label>
      <InputTextarea
        id={id}
        className={cn("w-full", rawErrors.length > 0 ? "p-invalid" : "")}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={readonly}
        value={value}
        required={required}
        autoFocus={autofocus}
        rows={options.rows || 5}
        autoResize
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
    </>
  );
};

export default TextareaWidget;
