import React from "react";
import {
  NumberInput,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInputField,
  NumberInputStepper,
  FormControl,
  FormLabel,
} from "@chakra-ui/react";
import { WidgetProps, utils } from "@rjsf/core";

const { getDisplayLabel } = utils;

const UpDownWidget = ({
  id,
  schema,
  uiSchema,
  readonly,
  disabled,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps) => {
  const displayLabel =
    getDisplayLabel(schema, uiSchema) && (!!label || !!schema.title);

  const _onChange = (value: string | number) => onChange(value);
  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement | any>) => onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement | any>) => onFocus(id, value);

  return (
    <FormControl>
      {displayLabel ? (
        <FormLabel htmlFor={id}>{label || schema.title}</FormLabel>
      ) : null}
      <NumberInput
        isDisabled={disabled || readonly}
        value={value}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
      >
        <NumberInputField id={id} />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
    </FormControl>
  );
};

export default UpDownWidget;
