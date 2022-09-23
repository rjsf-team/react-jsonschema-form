import React from "react";

import Checkbox from "antd/lib/checkbox";

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

  return Array.isArray(enumOptions) && enumOptions.length > 0 ? (
    <Checkbox.Group
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onBlur={!readonly ? handleBlur : undefined}
      onChange={!readonly ? handleChange : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      value={value}
    >
      {Array.isArray(enumOptions) &&
        enumOptions.map(({ value: optionValue, label: optionLabel }, i) => (
          <span key={optionValue}>
            <Checkbox
              id={`${id}-${optionValue}`}
              name={id}
              autoFocus={i === 0 ? autofocus : false}
              disabled={
                Array.isArray(enumDisabled) &&
                enumDisabled.indexOf(value) !== -1
              }
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
