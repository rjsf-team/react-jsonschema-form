import React from "react";
import {
  FormControl,
  FormLabel,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
} from "@chakra-ui/react";
import {
  FormContextType,
  rangeSpec,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";
import { getChakra } from "../utils";

export default function RangeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
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
  registry,
}: WidgetProps<T, S, F>) {
  const { schemaUtils } = registry;
  const chakraProps = getChakra({ uiSchema });

  const sliderWidgetProps = { value, label, id, ...rangeSpec<S>(schema) };

  const displayLabel =
    schemaUtils.getDisplayLabel(schema, uiSchema) &&
    (!!label || !!schema.title);

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
        name={id}
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
}
