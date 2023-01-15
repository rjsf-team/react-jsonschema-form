import React from "react";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import FormLabel from "@mui/material/FormLabel";
import {
  ariaDescribedByIds,
  enumOptionsDeselectValue,
  enumOptionsSelectValue,
  FormContextType,
  WidgetProps,
  RJSFSchema,
  StrictRJSFSchema,
} from "@rjsf/utils";

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
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
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, inline } = options;
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const _onChange =
    (option: any) =>
    ({ target: { checked } }: React.ChangeEvent<HTMLInputElement>) => {
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

  return (
    <>
      <FormLabel required={required} htmlFor={id}>
        {label || schema.title}
      </FormLabel>
      <FormGroup id={id} row={!!inline}>
        {Array.isArray(enumOptions) &&
          enumOptions.map((option, index: number) => {
            const checked = checkboxesValues.includes(option.value);
            const itemDisabled =
              Array.isArray(enumDisabled) &&
              enumDisabled.indexOf(option.value) !== -1;
            const checkbox = (
              <Checkbox
                id={`${id}-${option.value}`}
                name={id}
                checked={checked}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={autofocus && index === 0}
                onChange={_onChange(option)}
                onBlur={_onBlur}
                onFocus={_onFocus}
                aria-describedby={ariaDescribedByIds<T>(id)}
              />
            );
            return (
              <FormControlLabel
                control={checkbox}
                key={option.value}
                label={option.label}
              />
            );
          })}
      </FormGroup>
    </>
  );
}
