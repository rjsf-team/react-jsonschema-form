import { Select } from '@chakra-ui/core'
import React from 'react'
import PropTypes from 'prop-types'
//@ts-ignore
import { guessType, asNumber } from '@rjsf/core/lib/utils'
import { WidgetProps } from '@rjsf/core'

const nums = new Set(['number', 'integer'])

/**
 * This is a silly limitation in the DOM where option change event values are
 * always retrieved as strings.
 */
function processValue(schema: { enum?: any; type?: any; items?: any }, value: string | any[]) {
  // "enum" is a reserved word, so only "type" and "items" can be destructured
  const { type, items } = schema
  if (value === '') {
    return undefined
  }
  if (type === 'array' && items && nums.has(items.type)) {
    return (value as any[]).map(asNumber)
  }
  if (type === 'boolean') {
    return value === 'true'
  }
  if (type === 'number') {
    return asNumber(value)
  }

  // If type is undefined, but an enum is present, try and infer the type from
  // the enum values
  if (schema.enum) {
    if (schema.enum.every((x: any) => guessType(x) === 'number')) {
      return asNumber(value)
    }
    if (schema.enum.every((x: any) => guessType(x) === 'boolean')) {
      return value === 'true'
    }
  }

  return value
}

function getValue(event: React.ChangeEvent<HTMLSelectElement>, multiple: boolean) {
  if (multiple) {
    //@ts-ignore
    return [].slice.call(event.target.options).filter(o => o.selected).map(o => o.value)
  }
  return event.target.value
}

function SelectWidget(props: WidgetProps) {
  const {
    schema,
    id,
    options,
    value,
    required,
    disabled,
    readonly,
    multiple,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    placeholder
  } = props
  const { enumOptions, enumDisabled } = options
  const emptyValue = multiple ? [] : ''
  return (
    <Select
      id={id}
      multiple={multiple}
      value={typeof value === 'undefined' ? emptyValue : value}
      isRequired={required}
      isDisabled={disabled}
      isReadOnly={readonly}
      autoFocus={autofocus}
      onBlur={
        onBlur &&
        (event => {
          const newValue = getValue(event, multiple)
          onBlur(id, processValue(schema, newValue))
        })
      }
      onFocus={
        onFocus &&
        (event => {
          const newValue = getValue(event, multiple)
          onFocus(id, processValue(schema, newValue))
        })
      }
      onChange={event => {
        const newValue = getValue(event, multiple)
        onChange(processValue(schema, newValue))
      }}>
      {!multiple && schema.default === undefined && <option value="">{placeholder}</option>}
      {(enumOptions as any[]).map(({ value, label }, i) => {
        const disabled = enumDisabled && (enumDisabled as string[]).indexOf(value) !== -1
        return (
          // eslint-disable-next-line react/no-array-index-key
          <option key={i} value={value} disabled={disabled as boolean}>
            {label}
          </option>
        )
      })}
    </Select>
  )
}

SelectWidget.defaultProps = {
  autofocus: false,
  required: false,
  disabled: false,
  readonly: false,
  multiple: false,
  onChange: null,
  onBlur: null,
  onFocus: null,
  // value: null
}

if (process.env.NODE_ENV !== 'production') {
  SelectWidget.propTypes = {
    // eslint-disable-next-line react/forbid-prop-types
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    options: PropTypes.shape({
      enumOptions: PropTypes.array
    }).isRequired,
    // value: PropTypes.any,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    multiple: PropTypes.bool,
    autofocus: PropTypes.bool,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    onFocus: PropTypes.func
  }
}

export default SelectWidget
