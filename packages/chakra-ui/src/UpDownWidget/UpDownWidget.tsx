import React from 'react'
import {
  NumberInput,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInputField,
  NumberInputStepper
} from '@chakra-ui/core'

const UpDownWidget = ({ id, readonly, disabled, value, onChange, onBlur, onFocus }) => {
  const _onChange = value => onChange(value)
  const _onBlur = ({ target: { value } }) => onBlur(id, value)
  const _onFocus = ({ target: { value } }) => onFocus(id, value)

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
