import React from 'react';
// import PropTypes from 'prop-types';
import moment from 'moment';

import { WidgetProps } from 'react-jsonschema-form';
import { DatePicker } from 'antd';

const DateTimeWidget = ({
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

  const handleChange = nextValue =>
    onChange(nextValue && nextValue.toISOString());

  const handleBlur = () => onBlur(id, value);

  const handleFocus = () => onFocus(id, value);

  return (
    <DatePicker
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      showTime
      style={{ width: '100%' }}
      value={value && moment(value)}
    />
  );
};

DateTimeWidget.propTypes = WidgetProps;

export default DateTimeWidget;
