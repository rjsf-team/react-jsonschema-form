import React from 'react';

import Checkbox from 'antd/lib/checkbox';

const CheckboxWidget = ({
  autofocus,
  disabled,
  formContext,
  id,
  label,
  onBlur,
  onChange,
  onFocus,
  // options,
  // placeholder,
  readonly,
  // required,
  // schema,
  value,
}) => {
  const { readonlyAsDisabled = true } = formContext;

  const handleChange = ({ target }) => onChange(target.checked);

  const handleBlur = ({ target }) => onBlur(id, target.checked);

  const handleFocus = ({ target }) => onFocus(id, target.checked);

  return (
    <Checkbox
      autoFocus={autofocus}
      checked={typeof value === 'undefined' ? false : value}
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
    >
      {label}
    </Checkbox>
  );
};

export default CheckboxWidget;
