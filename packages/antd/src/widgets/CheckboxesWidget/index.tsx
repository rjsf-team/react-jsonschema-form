import React from "react";
import Checkbox from "antd/lib/checkbox";
import {
  FormContextType,
  WidgetProps,
  RJSFSchema,
  StrictRJSFSchema,
  GenericObjectType,
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
  autofocus,
  disabled,
  formContext,
  id,
  onBlur,
  onChange,
  onFocus,
  options,
  readonly,
  value,
}: WidgetProps<T, S, F>) {
  const { readonlyAsDisabled = true } = formContext as GenericObjectType;

  const { enumOptions, enumDisabled, inline } = options;

  const handleChange = (nextValue: any) => onChange(nextValue);

  const handleBlur = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onBlur(id, target.value);

  const handleFocus = ({ target }: React.FocusEvent<HTMLInputElement>) =>
    onFocus(id, target.value);

  // Antd's typescript definitions do not contain the following props that are actually necessary and, if provided,
  // they are used, so hacking them in via by spreading `extraProps` on the component to avoid typescript errors
  const extraProps = {
    id,
    onBlur: !readonly ? handleBlur : undefined,
    onFocus: !readonly ? handleFocus : undefined,
  };

  return Array.isArray(enumOptions) && enumOptions.length > 0 ? (
    <Checkbox.Group
      disabled={disabled || (readonlyAsDisabled && readonly)}
      name={id}
      onChange={!readonly ? handleChange : undefined}
      value={value}
      {...extraProps}
    >
      {Array.isArray(enumOptions) &&
        enumOptions.map(({ value: optionValue, label: optionLabel }, i) => (
          <span key={optionValue}>
            <Checkbox
              id={`${id}-${optionValue}`}
              name={id}
              autoFocus={i === 0 ? autofocus : false}
              disabled={
                Array.isArray(enumDisabled) &&
                enumDisabled.indexOf(value) !== -1
              }
              value={optionValue}
            >
              {optionLabel}
            </Checkbox>
            {!inline && <br />}
          </span>
        ))}
    </Checkbox.Group>
  ) : null;
}
