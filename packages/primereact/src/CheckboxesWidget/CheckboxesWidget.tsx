import { WidgetProps } from "@rjsf/core";
import { Checkbox, CheckboxChangeParams } from "primereact/checkbox";
import React from "react";
import cn from "clsx";

const selectValue = (value: any, selected: any, all: any) => {
  const at = all.indexOf(value);
  const updated = selected.slice(0, at).concat(value, selected.slice(at));

  // As inserting values at predefined index positions doesn't work with empty
  // arrays, we need to reorder the updated selection to match the initial order
  return updated.sort((a: any, b: any) => all.indexOf(a) > all.indexOf(b));
};

const deselectValue = (value: any, selected: any) => {
  return selected.filter((v: any) => v !== value);
};

const CheckboxesWidget = ({
  schema,
  label,
  id,
  disabled,
  options,
  value,
  readonly,
  required,
  onChange,
}: WidgetProps) => {
  const { enumOptions, enumDisabled, inline } = options;

  const _onChange = (option: any) => ({ checked }: CheckboxChangeParams) => {
    const all = (enumOptions as any).map(({ value }: any) => value);
    if (checked) {
      onChange(selectValue(option.value, value, all));
    } else {
      onChange(deselectValue(option.value, value));
    }
  };
  const labelValue = label || schema.title;

  return (
    <div>
      {labelValue && (
        <label htmlFor={id} className="mb-1">
          {labelValue}
        </label>
      )}
      <div className={cn("flex", inline ? "gap-3" : "gap-2")}>
        {(enumOptions as any).map((option: any, index: number) => {
          const checked = Array.isArray(value) ? value.includes(option.value) : value === option.value;
          const itemDisabled = Array.isArray(enumDisabled) && (enumDisabled as string[]).includes(option.value);

          return (
            <div key={index} className={cn(inline ? "inline-flex" : "flex", "align-items-start gap-2")}>
              <Checkbox
                inputId={`${id}_${index}`}
                checked={checked}
                required={required}
                disabled={disabled || itemDisabled || readonly}
                onChange={_onChange(option)}
              />
              <label htmlFor={`${id}_${index}`}>{option.label}</label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CheckboxesWidget;
