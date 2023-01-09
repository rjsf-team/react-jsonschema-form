import React, { FocusEvent, useCallback } from "react";
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from "@rjsf/utils";

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
function RadioWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  options,
  value,
  required,
  disabled,
  readonly,
  autofocus = false,
  onBlur,
  onFocus,
  onChange,
  id,
}: WidgetProps<T, S, F>) {
  // Generating a unique field name to identify this set of radio buttons
  const name = Math.random().toString();
  const { enumOptions, enumDisabled, inline } = options;
  // checked={checked} has been moved above name={name}, As mentioned in #349;
  // this is a temporary fix for radio button rendering bug in React, facebook/react#7630.

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => onBlur(id, event.target.value),
    [onBlur, id]
  );

  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => onFocus(id, event.target.value),
    [onFocus, id]
  );

  return (
    <div className="field-radio-group" id={id}>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, i) => {
          const checked = option.value === value;
          const itemDisabled =
            Array.isArray(enumDisabled) &&
            enumDisabled.indexOf(option.value) != -1;
          const disabledCls =
            disabled || itemDisabled || readonly ? "disabled" : "";

          const handleChange = () => onChange(option.value);

          const radio = (
            <span>
              <input
                type="radio"
                id={`${id}-${option.value}`}
                checked={checked}
                name={name}
                required={required}
                value={option.value}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={autofocus && i === 0}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
              />
              <span>{option.label}</span>
            </span>
          );

          return inline ? (
            <label key={option.value} className={`radio-inline ${disabledCls}`}>
              {radio}
            </label>
          ) : (
            <div key={option.value} className={`radio ${disabledCls}`}>
              <label>{radio}</label>
            </div>
          );
        })}
    </div>
  );
}

export default RadioWidget;
