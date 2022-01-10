import React from "react";
import {
  NumberInput,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInputField,
  NumberInputStepper, FormControl, FormLabel,
} from "@chakra-ui/react";
import { WidgetProps } from "@rjsf/core";

const UpDownWidget = ({ id, readonly, disabled, value, onChange, onBlur, onFocus }: WidgetProps) => {
  const _onChange = (value: string | number) => onChange(value);
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement | any>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: React.FocusEvent<HTMLInputElement | any>) => onFocus(id, value);

  return (
    <FormControl>
      <FormLabel htmlFor={id}>Amount</FormLabel>
      <NumberInput
        isDisabled={disabled || readonly}
        value={value}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}>
        <NumberInputField id={id}/>
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
    </FormControl>
  );
};

export default UpDownWidget;
