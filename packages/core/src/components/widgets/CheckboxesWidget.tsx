import { ChangeEvent, FocusEvent, useCallback } from 'react';
import {
  ariaDescribedByIds,
  enumOptionsDeselectValue,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  enumOptionsValueForIndex,
  optionId,
  FormContextType,
  WidgetProps,
  RJSFSchema,
  StrictRJSFSchema,
} from '@rjsf/utils';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
function CheckboxesWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  disabled,
  options: { inline = false, enumOptions, enumDisabled, emptyValue },
  value,
  autofocus = false,
  readonly,
  onChange,
  onBlur,
  onFocus,
}: WidgetProps<T, S, F>) {
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const handleBlur = useCallback(
    ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
      onBlur(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue)),
    [onBlur, id]
  );

  const handleFocus = useCallback(
    ({ target: { value } }: FocusEvent<HTMLInputElement>) =>
      onFocus(id, enumOptionsValueForIndex<S>(value, enumOptions, emptyValue)),
    [onFocus, id]
  );
  return (
    <div className='checkboxes' id={id}>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index) => {
          const checked = enumOptionsIsSelected<S>(option.value, checkboxesValues);
          const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;
          const disabledCls = disabled || itemDisabled || readonly ? 'disabled' : '';

          const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
            if (event.target.checked) {
              onChange(enumOptionsSelectValue<S>(index, checkboxesValues, enumOptions));
            } else {
              onChange(enumOptionsDeselectValue<S>(index, checkboxesValues, enumOptions));
            }
          };

          const checkbox = (
            <span>
              <input
                type='checkbox'
                id={optionId(id, index)}
                name={id}
                checked={checked}
                value={String(index)}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={autofocus && index === 0}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                aria-describedby={ariaDescribedByIds<T>(id)}
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
