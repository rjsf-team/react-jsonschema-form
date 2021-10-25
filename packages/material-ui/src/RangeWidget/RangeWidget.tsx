import React from "react";

import Slider from "@material-ui/core/Slider";
import FormLabel from "@material-ui/core/FormLabel";

import { utils } from "@visma/rjsf-core";
import { WidgetProps } from "@visma/rjsf-core";

const { rangeSpec } = utils;

const generateWithMiddleMarks = (min: number, max: number, step: number) => {
  const middleMarks = [];

  for (let i = min; i < max; i = i + step) {
    middleMarks.push({value: i, label: i.toString()});
  }

  middleMarks.push({value: max, label: max.toString()})

  return middleMarks;
}

const generateMarks = (min?: number, max?: number, step?: number) => {
  if (min === undefined || max === undefined ) {
    return [];
  }

  if ((max-min)/step! < 10) {
    return generateWithMiddleMarks(min!, max!, step!);
  }

  return [{value: min!, label: min!.toString()}, {value: max!, label: max!.toString()}];
}

const RangeWidget = ({
  value,
  readonly,
  disabled,
  onBlur,
  onFocus,
  options,
  schema,
  onChange,
  required,
  label,
  id,
}: WidgetProps) => {
  let sliderProps = { value, label, id, ...rangeSpec(schema) };

  const _onChange = ({}, value: any) =>
    onChange(value === "" ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const marks = generateMarks(sliderProps.min, sliderProps.max, sliderProps.step);

  return (
    <>
      <FormLabel required={required} id={id}>
        {label}
      </FormLabel>
      <Slider
        disabled={disabled || readonly}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        valueLabelDisplay="auto"
        marks={marks}
        {...sliderProps}
      />
    </>
  );
};

export default RangeWidget;
