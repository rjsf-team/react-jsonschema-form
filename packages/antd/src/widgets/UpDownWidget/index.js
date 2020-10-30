import React from 'react';

import InputNumber from 'antd/lib/input-number';
import { rangeSpec } from '@rjsf/core/lib/utils'

const INPUT_STYLE = {
  width: '100%',
};

const UpDownWidget = ({
  // autofocus,
  disabled,
  formContext,
  id,
  onBlur,
  onChange,
  onFocus,
  // options,
  placeholder,
  readonly,
  // required,
  schema,
  value,
}) => {
  const { readonlyAsDisabled = true } = formContext;

  const handleChange = (nextValue) => onChange(nextValue);

  const handleBlur = ({ target }) => onBlur(id, target.value);

  const handleFocus = ({ target }) => onFocus(id, target.value);

  const step = schema.type === 'number' ? 'any' : undefined // non-integer numbers shouldn't have a default step of 1
  const stepProps = rangeSpec(schema) // sets step, min, and max from the schema

  return (
    <InputNumber
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      style={INPUT_STYLE}
      type="number"
      step={step}
      {...stepProps}
      value={value}
    />
  );
};

export default UpDownWidget;
