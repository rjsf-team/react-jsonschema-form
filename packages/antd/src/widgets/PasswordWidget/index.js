import React from 'react';
// import PropTypes from 'prop-types';

import { WidgetProps } from 'react-jsonschema-form';
import { Input } from 'antd';

const PasswordWidget = ({
  // autofocus,
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
  // schema,
  value,
}) => {
  const { readonlyAsDisabled = true } = formContext;

  const emptyValue = options.emptyValue || '';

  const handleChange = ({ target }) =>
    onChange(target.value === '' ? emptyValue : target.value);

  const handleBlur = ({ target }) => onBlur(id, target.value);

  const handleFocus = ({ target }) => onFocus(id, target.value);

  return (
    <Input.Password
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      value={value || ''}
    />
  );
};

PasswordWidget.propTypes = WidgetProps;

export default PasswordWidget;
