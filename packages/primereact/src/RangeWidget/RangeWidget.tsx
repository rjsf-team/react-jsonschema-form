import React from "react";
import { utils, WidgetProps } from "@rjsf/core";
import { Slider, SliderChangeParams } from "primereact/slider";

const { rangeSpec } = utils;

const RangeWidget = ({
  value,
  readonly,
  disabled,
  schema,
  onChange,
  required,
  label,
  id,
  uiSchema,
}: WidgetProps) => {
  const sliderProps = { value, label, id, ...rangeSpec(schema) };

  const _onChange = ({ value }: SliderChangeParams) =>
    onChange(value as number);

  return (
    <div>
      <label htmlFor={id} className="block">
        {uiSchema["ui:title"] || schema.title || label}
        {(label || uiSchema["ui:title"] || schema.title) && required ? "*" : null}
      </label>
      <Slider
        disabled={disabled || readonly}
        onChange={_onChange}
        {...sliderProps}
        range={false}
      />
    </div>
  );
};

export default RangeWidget;
