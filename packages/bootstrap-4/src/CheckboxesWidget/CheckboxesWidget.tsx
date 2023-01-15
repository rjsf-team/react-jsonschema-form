import React from "react";
import Form from "react-bootstrap/Form";
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";

const selectValue = (value: any, selected: any[], all: any) => {
  const at = all.indexOf(value);
  const updated = selected.slice(0, at).concat(value, selected.slice(at));

  // As inserting values at predefined index positions doesn't work with empty
  // arrays, we need to reorder the updated selection to match the initial order
  return updated.sort((a, b) => Number(all.indexOf(a) > all.indexOf(b)));
};

const deselectValue = (value: any, selected: any[]) => {
  return selected.filter((v: any) => v !== value);
};

export default function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
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
      const all = (enumOptions as any).map(({ value }: any) => value);

      if (checked) {
        onChange(selectValue(option.value, checkboxesValues, all));
      } else {
        onChange(deselectValue(option.value, checkboxesValues));
      }
    };

  const _onBlur = ({ target: { value } }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, value);
  const _onFocus = ({
    target: { value },
  }: React.FocusEvent<HTMLInputElement>) => onFocus(id, value);

  return (
    <Form.Group>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index: number) => {
          const checked = checkboxesValues.includes(option.value);
          const itemDisabled =
            Array.isArray(enumDisabled) &&
            enumDisabled.indexOf(option.value) !== -1;

          return (
            <Form.Check
              key={option.value}
              inline={inline}
              custom
              required={required}
              checked={checked}
              className="bg-transparent border-0"
              type={"checkbox"}
              id={`${id}-${option.value}`}
              name={id}
              label={option.label}
              autoFocus={autofocus && index === 0}
              onChange={_onChange(option)}
              onBlur={_onBlur}
              onFocus={_onFocus}
              disabled={disabled || itemDisabled || readonly}
            />
          );
        })}
    </Form.Group>
  );
}
