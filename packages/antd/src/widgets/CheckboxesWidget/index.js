import React from 'react';
import _ from 'lodash';

import Checkbox from 'antd/lib/checkbox';

const CheckboxesWidget = ({
  autofocus,
  disabled,
  formContext,
  id,
  // label,
  onBlur,
  onChange,
  onFocus,
  options,
  // placeholder,
  readonly,
  // required,
  // schema,
  value,
}) => {
  const { readonlyAsDisabled = true } = formContext;

  const { enumOptions, enumDisabled, inline } = options;

  const handleChange = (nextValue) => onChange(nextValue);

  const handleBlur = ({ target }) => onBlur(id, target.value);

  const handleFocus = ({ target }) => onFocus(id, target.value);

  return !_.isEmpty(enumOptions) ? (
    <Checkbox.Group
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      value={value}
    >
      {enumOptions.map(({ value: optionValue, label: optionLabel }, i) => (
        <span key={optionValue}>
          <Checkbox
            autoFocus={i === 0 ? autofocus : false}
            disabled={enumDisabled && enumDisabled.indexOf(value) !== -1}
            value={optionValue}
          >
            {optionLabel}
          </Checkbox>
          {!inline && <br />}
        </span>
      ))}
    </Checkbox.Group>
  ) : null;
};

export default CheckboxesWidget;
