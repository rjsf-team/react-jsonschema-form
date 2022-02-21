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
  const labelValue = uiSchema["ui:title"] || schema.title || label;

  return (
    <div>
      {labelValue && (
        <label htmlFor={id} className="block mb-1">
          {labelValue}
          {required ? "*" : null}
        </label>
      )}
      <div className={cn("flex", inline ? "gap-3" : "gap-2")}>
        {(enumOptions as any[]).map((option, i) => {
          const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.includes(option.value);
          const checked = option.value == value;

          return (
            <div key={i} className={cn(inline ? "inline-flex" : "flex", "align-items-start gap-2")}>
              <RadioButton
                inputId={option.id}
                name={id}
                disabled={disabled || itemDisabled || readonly}
                checked={checked}
                required={required}
                value={option.value}
                onChange={_onChange}
              />
              <label htmlFor={option.id}>{option.label}</label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RadioWidget;
