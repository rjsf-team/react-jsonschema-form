import React from "react";
import { Dropdown, IDropdownOption } from "@fluentui/react";
import {
  ariaDescribedByIds,
  enumOptionsDeselectValue,
  enumOptionsIndexForValue,
  enumOptionsSelectValue,
  enumOptionsValueForIndex,
  WidgetProps,
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
} from "@rjsf/utils";
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
  "openOnKeyboardFocus",
];

export default function SelectWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
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
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, emptyValue } = options;

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
        onChange(enumOptionsSelectValue(item.key, valueOrDefault, enumOptions));
      } else {
        onChange(
          enumOptionsDeselectValue(item.key, valueOrDefault, enumOptions)
        );
      }
    } else {
      onChange(enumOptionsValueForIndex<S>(item.key, enumOptions, emptyValue));
    }
  };
  const _onBlur = (e: any) =>
    onBlur(
      id,
      enumOptionsValueForIndex<S>(e.target.value, enumOptions, emptyValue)
    );

  const _onFocus = (e: any) =>
    onFocus(
      id,
      enumOptionsValueForIndex<S>(e.target.value, enumOptions, emptyValue)
    );

  const newOptions = Array.isArray(enumOptions)
    ? enumOptions.map((option, index) => ({
        key: String(index),
        text: option.label,
        disabled:
          Array.isArray(enumDisabled) &&
          enumDisabled.indexOf(option.value) !== -1,
      }))
    : [];

  const uiProps = _pick((options.props as object) || {}, allowedProps);
  const selectedIndexes = enumOptionsIndexForValue<S>(
    value,
    enumOptions,
    multiple
  );
  return (
    <Dropdown
      id={id}
      label={label || schema.title}
      multiSelect={multiple}
      defaultSelectedKey={multiple ? undefined : selectedIndexes}
      defaultSelectedKeys={multiple ? (selectedIndexes as string[]) : undefined}
      required={required}
      options={newOptions}
      disabled={disabled || readonly}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      {...uiProps}
      aria-describedby={ariaDescribedByIds<T>(id)}
    />
  );
}
