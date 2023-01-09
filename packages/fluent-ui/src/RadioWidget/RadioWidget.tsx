import React from "react";
import {
  ChoiceGroup,
  IChoiceGroupOption,
  IChoiceGroupProps,
} from "@fluentui/react";
import { WidgetProps } from "@rjsf/utils";
import _pick from "lodash/pick";

const allowedProps: (keyof IChoiceGroupProps)[] = [
  "componentRef",
  "options",
  "defaultSelectedKey",
  "selectedKey",
  "onChange",
  "label",
  "onChanged",
  "theme",
  "styles",
  "ariaLabelledBy",
];

const RadioWidget = ({
  id,
  schema,
  options,
  value,
  required,
  label,
  onChange,
  onBlur,
  onFocus,
  disabled,
  readonly,
}: WidgetProps) => {
  const { enumOptions, enumDisabled } = options;

  function _onChange(
    _ev?: React.FormEvent<HTMLElement | HTMLInputElement>,
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

  const newOptions = Array.isArray(enumOptions)
    ? enumOptions.map((option) => ({
        key: option.value,
        name: id,
        id: `${id}-${option.value}`,
        text: option.label,
        disabled:
          Array.isArray(enumDisabled) &&
          enumDisabled.indexOf(option.value) !== -1,
      }))
    : [];

  const uiProps = _pick((options.props as object) || {}, allowedProps);
  return (
    <ChoiceGroup
      id={id}
      name={id}
      options={newOptions}
      disabled={disabled || readonly}
      onChange={_onChange}
      onFocus={_onFocus}
      onBlur={_onBlur}
      label={label || schema.title}
      required={required}
      selectedKey={value}
      {...uiProps}
    />
  );
};

export default RadioWidget;
