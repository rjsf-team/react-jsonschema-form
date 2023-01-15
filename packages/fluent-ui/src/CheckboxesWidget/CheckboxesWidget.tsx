import React from "react";
import { Checkbox, Label } from "@fluentui/react";
import {
  ariaDescribedByIds,
  enumOptionsDeselectValue,
  enumOptionsSelectValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";
import { allowedProps } from "../CheckboxWidget";
import _pick from "lodash/pick";

const styles_red = {
  // TODO: get this color from theme.
  color: "rgb(164, 38, 44)",
  fontSize: 12,
  fontWeight: "normal" as any,
  fontFamily: `"Segoe UI", "Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;`,
};

export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
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
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled } = options;
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const _onChange =
    (option: any) =>
    (_ev?: React.FormEvent<HTMLElement>, checked?: boolean) => {
      if (checked) {
        onChange(
          enumOptionsSelectValue(option.value, checkboxesValues, enumOptions)
        );
      } else {
        onChange(enumOptionsDeselectValue(option.value, checkboxesValues));
      }
    };

  const _onBlur = ({
    target: { value },
  }: React.FocusEvent<HTMLButtonElement>) => onBlur(id, value);

  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLButtonElement>) => onFocus(id, value);

  const uiProps = _pick((options.props as object) || {}, allowedProps);

  return (
    <>
      <Label>
        {label || schema.title}
        {required && <span style={styles_red}>&nbsp;*</span>}
      </Label>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index: number) => {
          const checked = checkboxesValues.includes(option.value);
          const itemDisabled =
            Array.isArray(enumDisabled) &&
            enumDisabled.indexOf(option.value) !== -1;
          return (
            <Checkbox
              id={`${id}-${option.value}`}
              name={id}
              checked={checked}
              label={option.label}
              disabled={disabled || itemDisabled || readonly}
              autoFocus={autofocus && index === 0}
              onChange={_onChange(option)}
              onBlur={_onBlur}
              onFocus={_onFocus}
              key={option.value}
              {...uiProps}
              aria-describedby={ariaDescribedByIds<T>(id)}
            />
          );
        })}
      <span style={styles_red}>{(rawErrors || []).join("\n")}</span>
    </>
  );
}
