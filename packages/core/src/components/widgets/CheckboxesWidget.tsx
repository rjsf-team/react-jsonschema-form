import React, { ChangeEvent } from "react";
import {
  ariaDescribedByIds,
  enumOptionsDeselectValue,
  enumOptionsSelectValue,
  optionId,
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
function CheckboxesWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  id,
  disabled,
  options: { inline = false, enumOptions, enumDisabled },
  value,
  autofocus = false,
  readonly,
  onChange,
}: WidgetProps<T, S, F>) {
  const checkboxesValues = Array.isArray(value) ? value : [value];
  return (
    <div className="checkboxes" id={id}>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index) => {
          const checked = checkboxesValues.includes(option.value);
          const itemDisabled =
            Array.isArray(enumDisabled) &&
            enumDisabled.indexOf(option.value) != -1;
          const disabledCls =
            disabled || itemDisabled || readonly ? "disabled" : "";

          const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
            if (event.target.checked) {
              onChange(
                enumOptionsSelectValue(
                  option.value,
                  checkboxesValues,
                  enumOptions
                )
              );
            } else {
              onChange(
                enumOptionsDeselectValue(option.value, checkboxesValues)
              );
            }
          };

          const checkbox = (
            <span>
              <input
                type="checkbox"
                id={optionId<S>(id, option)}
                name={id}
                checked={checked}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={autofocus && index === 0}
                onChange={handleChange}
                aria-describedby={ariaDescribedByIds<T>(id)}
              />
              <span>{option.label}</span>
            </span>
          );
          return inline ? (
            <label
              key={option.value}
              className={`checkbox-inline ${disabledCls}`}
            >
              {checkbox}
            </label>
          ) : (
            <div key={option.value} className={`checkbox ${disabledCls}`}>
              <label>{checkbox}</label>
            </div>
          );
        })}
    </div>
  );
}

export default CheckboxesWidget;
