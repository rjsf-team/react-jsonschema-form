import React from 'react'
import {
  NumberInput,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInputField,
  NumberInputStepper
} from '@chakra-ui/core'
import { WidgetProps } from '@rjsf/core'

const UpDownWidget = ({ id, readonly, disabled, value, onChange, onBlur, onFocus }: WidgetProps) => {
  const _onChange = (value: string | number) => onChange(value)
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, value)
  const _onFocus = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value)

  return (
    <NumberInput
      id={id}
      isDisabled={disabled || readonly}
      value={value}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}>
      <NumberInputField />
      <NumberInputStepper>
        <NumberIncrementStepper />
        <NumberDecrementStepper />
      </NumberInputStepper>
    </NumberInput>
  )
}

export default UpDownWidget
