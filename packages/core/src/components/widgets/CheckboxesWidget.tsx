import React, { ChangeEvent } from "react";
import { WidgetProps } from "@rjsf/utils";

function selectValue(value: any, selected: any[], all: any[]) {
  const at = all.indexOf(value);
  const updated = selected.slice(0, at).concat(value, selected.slice(at));
  // As inserting values at predefined index positions doesn't work with empty
  // arrays, we need to reorder the updated selection to match the initial order
  return updated.sort((a, b) => Number(all.indexOf(a) > all.indexOf(b)));
}

function deselectValue(value: any, selected: any[]) {
  return selected.filter((v) => v !== value);
}

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
function CheckboxesWidget<T = any, F = any>({
  id,
  disabled,
  options: { inline = false, enumOptions, enumDisabled },
  value,
  autofocus = false,
  readonly,
  onChange,
}: WidgetProps<T, F>) {
  return (
    <div className="checkboxes" id={id}>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index) => {
          const checked = value.indexOf(option.value) !== -1;
          const itemDisabled =
            enumDisabled && enumDisabled.indexOf(option.value) != -1;
          const disabledCls =
            disabled || itemDisabled || readonly ? "disabled" : "";

          const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
            const all = enumOptions.map(({ value }) => value);
            if (event.target.checked) {
              onChange(selectValue(option.value, value, all));
            } else {
              onChange(deselectValue(option.value, value));
            }
          };

          const checkbox = (
            <span>
              <input
                type="checkbox"
                id={`${id}_${index}`}
                checked={checked}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={autofocus && index === 0}
                onChange={handleChange}
              />
              <span>{option.label}</span>
            </span>
          );
          return inline ? (
            <label key={index} className={`checkbox-inline ${disabledCls}`}>
              {checkbox}
            </label>
          ) : (
            <div key={index} className={`checkbox ${disabledCls}`}>
              <label>{checkbox}</label>
            </div>
          );
        })}
    </div>
  );
}

export default CheckboxesWidget;
