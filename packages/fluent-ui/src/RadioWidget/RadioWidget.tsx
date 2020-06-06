import React from "react";
import { ChoiceGroup, IChoiceGroupOption } from "@fluentui/react";
import { WidgetProps } from "@rjsf/core";

const RadioWidget = ({
  id,
  schema,
  options,
  value,
  required,
  disabled,
  readonly,
  label,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps) => {
  // Generating a unique field name to identify this set of radio buttons
  const name = Math.random().toString();
  const { enumOptions, enumDisabled } = options;

  function _onChange(
    ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
    option?: IChoiceGroupOption
  ): void {
    if (option) {
      onChange(option.key);
    }
  }

  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  const row = options ? options.inline : false;

  const radioOptionsSource = (enumOptions as any[]) || [];

  const newOptions = radioOptionsSource.map(option => ({
    key: option.value,
    text: option.label,
  }));

  return (
    <>
      <ChoiceGroup
        options={newOptions as any}
        onChange={_onChange}
        onFocus={_onFocus}
        label={label || schema.title}
        required={required}
        selectedKey={value}
      />
    </>
  );
};

export default RadioWidget;
