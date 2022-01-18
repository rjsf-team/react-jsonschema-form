import React from "react";
import {
  FormControl,
  FormLabel,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
} from "@chakra-ui/react";
import { utils, WidgetProps } from "@rjsf/core";
import { getChakra } from "../utils";

const { rangeSpec, getDisplayLabel } = utils;

const RangeWidget = ({
  value,
  readonly,
  disabled,
  onBlur,
  onFocus,
  options,
  schema,
  uiSchema,
  onChange,
  label,
  id,
}: WidgetProps) => {
  const chakraProps = getChakra({ uiSchema });

  let sliderWidgetProps = { value, label, id, ...rangeSpec(schema) };

  const displayLabel =
    getDisplayLabel(schema, uiSchema) && (!!label || !!schema.title);

  const _onChange = (value: undefined | number) =>
    onChange(value === undefined ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  return (
    <FormControl mb={1} {...chakraProps}>
      {displayLabel ? (
        <FormLabel htmlFor={id}>{label || schema.title}</FormLabel>
      ) : null}
      <Slider
        {...sliderWidgetProps}
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
