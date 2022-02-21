import { WidgetProps } from "@rjsf/core";
import { InputText } from "primereact/inputtext";
import React from "react";
import cn from "clsx";

const TextWidget = ({
  id,
  placeholder,
  required,
  readonly,
  disabled,
  type,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  autofocus,
  options,
  schema,
  uiSchema,
  rawErrors = [],
}: WidgetProps) => {
  const _onChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);
  const inputType = (type || schema.type) === "string" ? "text" : `${type || schema.type}`
  const labelValue = uiSchema["ui:title"] || schema.title || label;

  return (
    <div>
      {labelValue && (
        <label htmlFor={id} className={cn("block mb-1", rawErrors.length > 0 && "text-color-danger")}>
          {labelValue}
          {required ? "*" : null}
        </label>
      )}
      <InputText
        id={id}
        placeholder={placeholder}
        autoFocus={autofocus}
        required={required}
        disabled={disabled}
        readOnly={readonly}
        className={cn("w-full", rawErrors.length > 0 ? "p-invalid" : "")}
        list={schema.examples ? `examples_${id}` : undefined}
        type={inputType}
        value={value || value === 0 ? value : ""}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      />
      {schema.examples ? (
        <datalist id={`examples_${id}`}>
          {(schema.examples as string[])
            .concat(schema.default ? ([schema.default] as string[]) : [])
            .map((example: any) => (
              <option key={example} value={example} />
            ))}
        </datalist>
      ) : null}
    </div>
  );
};

export default TextWidget;
