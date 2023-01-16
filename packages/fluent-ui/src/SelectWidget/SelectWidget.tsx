import React from "react";
import { Label, Dropdown, IDropdownOption } from "@fluentui/react";
import {
  ariaDescribedByIds,
  WidgetProps,
  processSelectValue,
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
      onChange(processSelectValue<T, S, F>(schema, item.key, options));
    }
  };
  const _onBlur = (e: any) =>
    onBlur(id, processSelectValue<T, S, F>(schema, e.target.value, options));

  const _onFocus = (e: any) =>
    onFocus(id, processSelectValue<T, S, F>(schema, e.target.value, options));

  const newOptions = (enumOptions as { value: any; label: any }[]).map(
    (option) => ({
      key: option.value,
      text: option.label,
      disabled: ((enumDisabled as any[]) || []).indexOf(option.value) !== -1,
    })
  );

  const uiProps = _pick((options.props as object) || {}, allowedProps);
  return (
    <>
      <Label>{label || schema.title}</Label>
      <Dropdown
        id={id}
        multiSelect={multiple}
        defaultSelectedKey={multiple ? undefined : value}
        defaultSelectedKeys={multiple ? value : undefined}
        required={required}
        options={newOptions}
        disabled={disabled || readonly}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        {...uiProps}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
    </>
  );
}
