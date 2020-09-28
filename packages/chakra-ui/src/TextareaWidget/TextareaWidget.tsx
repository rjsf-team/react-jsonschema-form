import { Textarea } from '@chakra-ui/core'
import React from 'react'

const TextareaWidget = ({
  id,
  placeholder,
  value,
  disabled,
  autofocus,
  readonly,
  onBlur,
  onFocus,
  onChange,
  options
}) => {
  const _onChange = ({ target: { value } }) => onChange(value === '' ? options.emptyValue : value)
  const _onBlur = ({ target: { value } }) => onBlur(id, value)
  const _onFocus = ({ target: { value } }) => onFocus(id, value)

  return (
    <Textarea
      id={id}
      value={value}
      placeholder={placeholder}
      isDisabled={disabled}
      isReadOnly={readonly}
      autoFocus={autofocus}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  )
}

export default TextareaWidget
