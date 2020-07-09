import React from 'react';
import dayjs from 'dayjs';

import DatePicker from '../../components/DatePicker';

const DATE_PICKER_STYLE = {
  width: '100%',
};

const DateWidget = ({
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
    onChange(nextValue && nextValue.format('YYYY-MM-DD'));

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
      showTime={false}
      style={DATE_PICKER_STYLE}
      value={value && dayjs(value)}
    />
  );
};

export default DateWidget;
