import { Checkbox } from '@chakra-ui/core'
import { WidgetProps } from '@rjsf/core'
import React from 'react'

const CheckboxWidget = (props: WidgetProps) => {
  const { id, value, disabled, readonly, onChange, onBlur, onFocus } = props

  const _onChange = ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => onChange(checked)
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, value)
  const _onFocus = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value)

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
