import React from "react";
import { WidgetProps } from "@rjsf/core";
import { RadioButton, RadioButtonChangeParams } from "primereact/radiobutton";
import cn from "clsx";

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
  uiSchema,
}: WidgetProps) => {
  const { enumOptions, enumDisabled } = options;

  const _onChange = ({ value }: RadioButtonChangeParams) =>
    onChange(schema.type == "boolean" ? value !== "false" : value);

  const inline = Boolean(options && options.inline);

  return (
    <div>
      <label htmlFor={id} className="block">
        {uiSchema["ui:title"] || schema.title || label}
        {(label || uiSchema["ui:title"] || schema.title) && required ? "*" : null}
      </label>
      {(enumOptions as any).map((option: any, i: number) => {
        const itemDisabled =
          Array.isArray(enumDisabled) &&
          enumDisabled.indexOf(option.value) !== -1;
        const checked = option.value == value;

        return (
          <div key={i} className={cn(inline ? "inline-flex" : "flex", "align-items-start")}>
            <RadioButton
              inputId={option.id}
              name={id}
              disabled={disabled || itemDisabled || readonly}
              checked={checked}
              required={required}
              value={option.value}
              onChange={_onChange}
            />
            <label htmlFor={option.id} className="ml-2">{option.label}</label>
          </div>
        );
      })}
    </div>
  );
};

export default RadioWidget;
