import type { ChangeEvent } from 'react';
import type { FormContextType, WidgetProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  enumOptionsDeselectValue,
  enumOptionsDomValues,
  enumOptionsIsDisabled,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  getControlAttributes,
  getOptionValueFormat,
  optionId,
  useOptionFocusHandlers,
} from '@rjsf/utils';

/** The `CheckboxesWidget` is a widget for rendering checkbox groups.
 *  It is typically used to represent an array of enums.
 *
 * @param props - The `WidgetProps` for this component
 */
function CheckboxesWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
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
  presentation,
}: WidgetProps<T, S, F>) {
  const { inline = false, enumOptions, enumDisabled } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });

  // A label's `for` can't name a group, so the group is labelled by reference, and each input described and invalid
  const { 'aria-labelledby': groupLabelledBy, ...inputAttributes } = getControlAttributes<T, S, F>({
    id,
    presentation,
  });
  return (
    <div className='checkboxes' id={id} role='group' aria-labelledby={groupLabelledBy}>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index) => {
          const checked = enumOptionsIsSelected<S>(option.value, checkboxesValues);
          const itemDisabled = enumOptionsIsDisabled(option.value, enumDisabled);
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
                value={domValues[index]}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={autofocus && index === 0}
                onChange={handleChange}
                onBlur={blurHandlers[index]}
                onFocus={focusHandlers[index]}
                {...inputAttributes}
              />
              <span>{option.label}</span>
            </span>
          );
          return inline ? (
            // oxlint-disable-next-line react/no-array-index-key
            <label key={index} className={`checkbox-inline ${disabledCls}`}>
              {checkbox}
            </label>
          ) : (
            // oxlint-disable-next-line react/no-array-index-key
            <div key={index} className={`checkbox ${disabledCls}`}>
              <label>{checkbox}</label>
            </div>
          );
        })}
    </div>
  );
}

export default CheckboxesWidget;
