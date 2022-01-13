import React from "react";
import { utils } from "@rjsf/core";
import { WidgetProps } from "@rjsf/core";
import {
  FormControl,
  FormLabel,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
} from "@chakra-ui/react";

const { rangeSpec } = utils;

const RangeWidget = ({
  value,
  readonly,
  disabled,
  onBlur,
  onFocus,
  options,
  schema,
  onChange,
  label,
  id,
}: WidgetProps) => {
  let sliderProps = { value, label, id, ...rangeSpec(schema) };

  const _onChange = (value: undefined | number) =>
    onChange(value === undefined ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  return (
    <FormControl>
      <FormLabel htmlFor={id}>{label}</FormLabel>
      <Slider
        {...sliderProps}
        id={id}
        isDisabled={disabled || readonly}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </FormControl>
  );
};

export default RangeWidget;
