import React from "react";
import { WidgetProps } from "@rjsf/utils";
import Radio, { RadioChangeEvent } from "antd/lib/radio";

const RadioWidget = ({
  autofocus,
  disabled,
  formContext,
  id,
  onBlur,
  onChange,
  onFocus,
  options,
  readonly,
  schema,
  value,
}: WidgetProps) => {
  const { readonlyAsDisabled = true } = formContext;

  const { enumOptions, enumDisabled } = options;

  const handleChange = ({ target: { value: nextValue } }: RadioChangeEvent) =>
    onChange(schema.type === "boolean" ? nextValue !== "false" : nextValue);

  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, target.value);

  const handleFocus = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, target.value);

  return (
    <Radio.Group
      disabled={disabled || (readonlyAsDisabled && readonly)}
      id={id}
      name={id}
      onChange={!readonly ? handleChange : undefined}
      onBlur={!readonly ? handleBlur : undefined}
      onFocus={!readonly ? handleFocus : undefined}
      value={`${value}`}
    >
      {Array.isArray(enumOptions) &&
        enumOptions.map(({ value: optionValue, label: optionLabel }, i) => (
          <Radio
            id={`${id}-${optionValue}`}
            name={id}
            autoFocus={i === 0 ? autofocus : false}
            disabled={
              Array.isArray(enumDisabled) && enumDisabled.indexOf(value) !== -1
            }
            key={optionValue}
            value={`${optionValue}`}
          >
            {optionLabel}
          </Radio>
        ))}
    </Radio.Group>
  );
};

export default RadioWidget;
