import React from 'react';
import dayjs from 'dayjs';

import DatePicker from '../../components/DatePicker';

const DATE_PICKER_STYLE = {
  width: '100%',
};

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

  const handleChange = (nextValue) =>
    onChange(nextValue && nextValue.toISOString());

  const handleBlur = () => onBlur(id, value);

  const handleFocus = () => onFocus(id, value);

  const getPopupContainer = (node) => node.parentNode;

  return (
    <DatePicker
      disabled={disabled || (readonlyAsDisabled && readonly)}
      getPopupContainer={getPopupContainer}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      placeholder={placeholder}
      showTime
      style={DATE_PICKER_STYLE}
      value={value && dayjs(value)}
    />
  );
};

export default DateTimeWidget;
