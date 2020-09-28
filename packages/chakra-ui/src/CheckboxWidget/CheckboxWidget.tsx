import { Checkbox } from '@chakra-ui/core'
import React from 'react'

const CheckboxWidget = props => {
  const { id, value, disabled, readonly, onChange, onBlur, onFocus } = props

  const _onChange = ({ target: { checked } }) => onChange(checked)
  const _onBlur = ({ target: { value } }) => onBlur(id, value)
  const _onFocus = ({ target: { value } }) => onFocus(id, value)

  return (
    <Checkbox
      id={id}
      isChecked={typeof value === 'undefined' ? false : value}
      isDisabled={disabled || readonly}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  )
}

export default CheckboxWidget
