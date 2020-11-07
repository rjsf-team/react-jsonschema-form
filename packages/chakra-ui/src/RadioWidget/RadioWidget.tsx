import { Radio, RadioGroup, FormControl } from '@chakra-ui/core'
import { WidgetProps } from '@rjsf/core';
import React, { ReactText } from 'react'

const RadioWidget = ({ id, schema, options, value, disabled, required, readonly, onChange, onBlur, onFocus }: WidgetProps) => {

  // Generating a unique field name to identify this set of radio buttons
  const name = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const { enumOptions, enumDisabled } = options


  // eslint-disable-next-line no-empty-pattern
  const _onChange = (value: ReactText) => onChange(schema.type === 'boolean' ? value !== 'false' : value)
  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onBlur(id, value)
  const _onFocus = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value)

  const inline = !!options.inline
  const paddingRatio = inline ? 4 : 2 // Number

  return (
    <FormControl required={required}>
      <RadioGroup
        name={name}
        value={`${value}`}
        isInline={inline}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}>
        {(enumOptions as any).map((option: { value: string | number; label: React.ReactNode; }, i: string | number | null | undefined) => {
          const itemDisabled = enumDisabled && (enumDisabled as (string | number)[]).indexOf(option.value) !== -1

          return (
            // eslint-disable-next-line react/no-array-index-key
            <Radio value={`${option.value}`} key={i} pr={paddingRatio} isDisabled={disabled || itemDisabled || readonly}>
              {option.label}
            </Radio>
          )
        })}
      </RadioGroup>
    </FormControl>
  )
}

export default RadioWidget
