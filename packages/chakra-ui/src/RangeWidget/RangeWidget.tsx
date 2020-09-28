import Slider, { SliderFilledTrack, SliderThumb, SliderTrack } from '@chakra-ui/core/dist/Slider'
import { rangeSpec } from 'react-jsonschema-form/lib/utils'
import React from 'react'

const RangeWidget = ({ value, readonly, disabled, onBlur, onFocus, options, schema, onChange, label, id }) => {
  const sliderProps = { value, label, id, ...rangeSpec(schema) }

  const _onChange = value => onChange(value === undefined ? options.emptyValue : value)
  const _onBlur = ({ target: { value } }) => onBlur(id, value)
  const _onFocus = ({ target: { value } }) => onFocus(id, value)

  return (
    <Slider {...sliderProps} isDisabled={disabled || readonly} onChange={_onChange} onBlur={_onBlur} onFocus={_onFocus}>
      <SliderTrack />
      <SliderFilledTrack />
      <SliderThumb />
    </Slider>
  )
}

export default RangeWidget
