import React from 'react';

import Input from 'antd/lib/checkbox';

const INPUT_STYLE = {
  width: '100%',
};

const ColorWidget = ({
  // autofocus,
  disabled,
  formContext,
  id,
  // label,
  onBlur,
  onChange,
  onFocus,
  // options,
  placeholder,
  readonly,
  // required,
  // schema,
  value,
}) => {
  const { readonlyAsDisabled = true } = formContext;

  const handleChange = ({ target }) => onChange(target.value);

  const handleBlur = ({ target }) => onBlur(id, target.value);

  const handleFocus = ({ target }) => onFocus(id, target.value);

  return (
    <Input
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      style={INPUT_STYLE}
      type="color"
      value={value}
    />
  );
};

export default ColorWidget;
