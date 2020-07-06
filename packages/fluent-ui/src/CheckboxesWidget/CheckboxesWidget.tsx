import React from "react";
import { Checkbox, Label } from "@fluentui/react";
import { WidgetProps } from "@rjsf/core";
import { allowedProps } from "../CheckboxWidget";
import _pick from "lodash/pick";

const styles_red = {
      // TODO: get this color from theme.
      color: "rgb(164, 38, 44)",
      fontSize: 12,
      fontWeight: "normal" as any,
      fontFamily: `"Segoe UI", "Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;`
    };

const selectValue = (value: any, selected: any, all: any) => {
  const at = all.indexOf(value);
  const updated = selected.slice(0, at).concat(value, selected.slice(at));

  // As inserting values at predefined index positions doesn't work with empty
  // arrays, we need to reorder the updated selection to match the initial order
  return updated.sort((a: any, b: any) => all.indexOf(a) > all.indexOf(b));
};

const deselectValue = (value: any, selected: any) => {
  return selected.filter((v: any) => v !== value);
};

const CheckboxesWidget = ({
  schema,
  label,
  id,
  disabled,
  options,
  value,
  autofocus,
  readonly,
  required,
  onChange,
  onBlur,
  onFocus,
  rawErrors = [],
}: WidgetProps) => {
  const { enumOptions, enumDisabled } = options;

  const _onChange = (option: any) => (
    _ev?: React.FormEvent<HTMLElement>,
    checked?: boolean
  ) => {
    const all = (enumOptions as any).map(({ value }: any) => value);

    if (checked) {
      onChange(selectValue(option.value, value, all));
    } else {
      onChange(deselectValue(option.value, value));
    }
  };

  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLButtonElement>) => onBlur(id, value);

  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLButtonElement>) => onFocus(id, value);

  const uiProps = _pick(options.props || {}, allowedProps);

  return (
    <>
      <Label>
        {label || schema.title}
        {required && <span style={styles_red}>&nbsp;*</span>}
      </Label>
      {(enumOptions as any).map((option: any, index: number) => {
        const checked = value.indexOf(option.value) !== -1;
        const itemDisabled =
          enumDisabled && (enumDisabled as any).indexOf(option.value) != -1;
        return (
          <Checkbox
            id={`${id}_${index}`}
            checked={checked}
            label={option.label}
            disabled={disabled || itemDisabled || readonly}
            autoFocus={autofocus && index === 0}
            onChange={_onChange(option)}
            onBlur={_onBlur}
            onFocus={_onFocus}
            key={index}
            {...uiProps}
          />
        );
      })}
      <span style={styles_red}>{(rawErrors || []).join("\n")}</span>
    </>
  );
};

export default CheckboxesWidget;
