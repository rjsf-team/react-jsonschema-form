import React from "react";
import { Checkbox } from "@fluentui/react";
import { WidgetProps } from "@rjsf/core";
import _pick from "lodash/pick";

// Keys of ICheckboxProps from @fluentui/react
export const allowedProps = [
  "ariaDescribedBy",
  "ariaLabel",
  "ariaPositionInSet",
  "ariaSetSize",
  "boxSide",
  "checked",
  "checkmarkIconProps",
  "className",
  "componentRef",
  "defaultChecked",
  "defaultIndeterminate",
  "disabled",
  "indeterminate",
  "inputProps",
  "keytipProps",
  "label",
  "onChange",
  "onRenderLabel",
  "styles",
  "theme"
];

const CheckboxWidget = (props: WidgetProps) => {
  const {
    id,
    value,
    // required,
    disabled,
    readonly,
    label,
    schema,
    autofocus,
    onChange,
    onBlur,
    onFocus,
    options,
  } = props;

  const _onChange = React.useCallback(({}, checked?: boolean): void => {
    onChange(checked);
  }, []);

  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLButtonElement>) => onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLButtonElement>) => onFocus(id, value);

  const uiProps = _pick(options.props || {}, allowedProps);

  return (
    <>
        <Checkbox
          id={id}
          label={label || schema.title}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          onBlur={_onBlur}
          onFocus={_onFocus}
          checked={typeof value === "undefined" ? false : value}
          onChange={_onChange}
          {...uiProps}
        />
    </>
  );
};

export default CheckboxWidget;
