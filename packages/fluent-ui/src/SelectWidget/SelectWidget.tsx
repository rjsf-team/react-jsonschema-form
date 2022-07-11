import React from "react";
import { Label, Dropdown, IDropdownOption } from "@fluentui/react";
import { WidgetProps } from "@rjsf/core";
import _pick from "lodash/pick";

// Keys of IDropdownProps from @fluentui/react
const allowedProps = [
  "placeHolder",
  "options",
  "onChange",
  "onChanged",
  "onRenderLabel",
  "onRenderPlaceholder",
  "onRenderPlaceHolder",
  "onRenderTitle",
  "onRenderCaretDown",
  "dropdownWidth",
  "responsiveMode",
  "defaultSelectedKeys",
  "selectedKeys",
  "multiselectDelimiter",
  "notifyOnReselect",
  "isDisabled",
  "keytipProps",
  "theme",
  "styles",

  // ISelectableDroppableTextProps
  "componentRef",
  "label",
  "ariaLabel",
  "id",
  "className",
  "defaultSelectedKey",
  "selectedKey",
  "multiSelect",
  "options",
  "onRenderContainer",
  "onRenderList",
  "onRenderItem",
  "onRenderOption",
  "onDismiss",
  "disabled",
  "required",
  "calloutProps",
  "panelProps",
  "errorMessage",
  "placeholder",
  "openOnKeyboardFocus"
];

const SelectWidget = ({
  schema,
  id,
  options,
  label,
  required,
  disabled,
  readonly,
  value,
  multiple,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps) => {
  const { enumOptions, enumDisabled } = options;

  const _onChange = (
    _ev?: React.FormEvent<HTMLElement>,
    item?: IDropdownOption
  ) => {
    if (!item) {
      return;
    }
    if (multiple) {
      const valueOrDefault = value || [];
      if (item.selected) {
        onChange([...valueOrDefault, item.key]);
      } else {
        onChange(valueOrDefault.filter((key: any) => key !== item.key));
      }
    } else {
      onChange(item.key);
    }
  };
  const _onBlur = (e: any) => onBlur(id, e.target.value);

  const _onFocus = (e: any) => onFocus(id, e.target.value);

  const newOptions = (enumOptions as {value: any, label: any}[]).map(option => ({
    key: option.value,
    text: option.label,
    disabled: (enumDisabled as any[] || []).indexOf(option.value) !== -1
  }));

  const uiProps = _pick(options.props || {}, allowedProps);
  return (
    <>
      <Label>{label || schema.title}</Label>
      <Dropdown
        multiSelect={multiple}
        defaultSelectedKey={value}
        required={required}
        options={newOptions}
        disabled={disabled || readonly}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        {...uiProps}
      />
    </>
  );
};

export default SelectWidget;
