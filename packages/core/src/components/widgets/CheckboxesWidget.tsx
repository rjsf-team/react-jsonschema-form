import { ChangeEvent, FocusEvent, useCallback } from 'react';
import {
  ariaDescribedByIds,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  enumOptionsDeselectValue,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
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
  options,
  value,
  autofocus = false,
  readonly,
  onChange,
  onBlur,
  onFocus,
  htmlName,
}: WidgetProps<T, S, F>) {
  const { inline = false, enumOptions, enumDisabled, emptyValue } = options;
  const useRealValues = !!options.useRealOptionValues;
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) =>
      onBlur(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, useRealValues, emptyValue)),
    [onBlur, id, enumOptions, emptyValue, useRealValues],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) =>
      onFocus(id, enumOptionValueDecoder<S>(target && target.value, enumOptions, useRealValues, emptyValue)),
    [onFocus, id, enumOptions, emptyValue, useRealValues],
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
                name={htmlName || id}
                checked={checked}
                value={enumOptionValueEncoder(option.value, index, useRealValues)}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={autofocus && index === 0}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                aria-describedby={ariaDescribedByIds(id)}
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
