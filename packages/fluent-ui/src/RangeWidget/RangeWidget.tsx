import React from "react";
import { Slider, Label } from "@fluentui/react";

import { utils } from "@rjsf/core";
import { WidgetProps } from "@rjsf/core";
import _pick from "lodash/pick";

const { rangeSpec } = utils;

const styles_red = {
  // TODO: get this color from theme.
  color: "rgb(164, 38, 44)",
  fontSize: 12,
  fontWeight: "normal" as any,
  fontFamily: `"Segoe UI", "Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;`,
};

// Keys of ISliderProps from @fluentui/react
const allowedProps = [
  "componentRef",
  "styles?",
  "theme",
  "label",
  "defaultValue",
  "value",
  "min",
  "max",
  "step",
  "showValue",
  "onChange",
  "ariaLabel",
  "ariaValueText",
  "vertical",
  "disabled",
  "snapToStep",
  "className",
  "buttonProps",
  "valueFormat",
  "originFromZero",
];

const RangeWidget = ({
  value,
  readonly,
  disabled,
  options,
  schema,
  //formContext,
  //registry,
  //rawErrors,
  onChange,
  required,
  label,
  id,
}: WidgetProps) => {
  let sliderProps = { value, label, id, ...rangeSpec(schema) };

  const _onChange = (value: number) => onChange(value);

  const uiProps = _pick(options.props || {}, allowedProps);
  return (
    <>
      <Label>
        {label || schema.title}
        {required && <span style={styles_red}>&nbsp;*</span>}
      </Label>
      <Slider
        disabled={disabled || readonly}
        min={sliderProps.min}
        max={sliderProps.max}
        step={sliderProps.step}
        onChange={_onChange}
        snapToStep
        {...uiProps}
      />
    </>
  );
};

export default RangeWidget;
