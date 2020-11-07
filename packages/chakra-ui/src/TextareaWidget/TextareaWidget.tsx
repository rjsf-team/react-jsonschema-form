import { Textarea } from '@chakra-ui/core'
import { WidgetProps } from '@rjsf/core'
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
}: WidgetProps) => {
  const _onChange = ({ target: { value } }: React.ChangeEvent<HTMLTextAreaElement>) => onChange(value === '' ? options.emptyValue : value)
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLTextAreaElement>) => onBlur(id, value)
  const _onFocus = ({ target: { value } }: React.FocusEvent<HTMLTextAreaElement>) => onFocus(id, value)

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
