import React from 'react';
// import PropTypes from 'prop-types';

import { WidgetProps } from 'react-jsonschema-form';
import { InputNumber } from 'antd';

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
  // schema,
  value,
}) => {
  const { readonlyAsDisabled = true } = formContext;

  const handleChange = nextValue => onChange(nextValue);

  const handleBlur = ({ target }) => onBlur(id, target.value);

  const handleFocus = ({ target }) => onFocus(id, target.value);

  return (
    <InputNumber
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      style={{ width: '100%' }}
      type="number"
      value={value}
    />
  );
};

UpDownWidget.propTypes = WidgetProps;

export default UpDownWidget;
