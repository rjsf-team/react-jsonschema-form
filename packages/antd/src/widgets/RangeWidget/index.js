/* eslint-disable no-else-return */
import React from 'react';

import { utils } from '@rjsf/core';
import Slider from 'antd/lib/slider';

const { rangeSpec } = utils;

const RangeWidget = ({
  autofocus,
  disabled,
  formContext,
  id,
  // label,
  onBlur,
  onChange,
  onFocus,
  options,
  placeholder,
  readonly,
  // required,
  schema,
  value,
}) => {
  const { readonlyAsDisabled = true } = formContext;

  const { min, max, step } = rangeSpec(schema);

  const emptyValue = options.emptyValue || '';

  const handleChange = (nextValue) =>
    onChange(nextValue === '' ? emptyValue : nextValue);

  const handleBlur = () => onBlur(id, value);

  const handleFocus = () => onFocus(id, value);

  return (
    <Slider
      autoFocus={autofocus}
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      max={max}
      min={min}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      range={false}
      step={step}
      value={value}
    />
  );
};

export default RangeWidget;
