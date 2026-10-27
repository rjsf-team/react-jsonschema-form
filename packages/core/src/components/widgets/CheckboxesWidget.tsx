import type { ChangeEvent } from 'react';
import type { FormContextType, WidgetProps, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import {
  enumOptionsAutofocusIndex,
  enumOptionsDeselectValue,
  enumOptionsDomValues,
  enumOptionsIsDisabled,
  enumOptionsIsSelected,
  enumOptionsSelectValue,
  getGroupAttributes,
  getOptionValueFormat,
  joinClassNames,
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
  registry,
  presentation,
}: WidgetProps<T, S, F>) {
  const { inline = false, enumOptions, enumDisabled } = options;
  const { classMap } = registry;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);
  const checkboxesValues = Array.isArray(value) ? value : [value];

  const { focusHandlers, blurHandlers } = useOptionFocusHandlers<T, S, F>({ id, options, onFocus, onBlur });

  const { group: groupAttributes, option: optionAttributes } = getGroupAttributes<T, S, F>(
    { id, presentation },
    'group',
  );
  const autofocusIndex = enumOptionsAutofocusIndex<S>(enumOptions, enumDisabled, autofocus);
  return (
    <div className='rjsf-checkboxes' id={id} {...groupAttributes}>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, index) => {
          const checked = enumOptionsIsSelected<S>(option.value, checkboxesValues);
          const itemDisabled = enumOptionsIsDisabled(option.value, enumDisabled);
          const optionDisabled = disabled || itemDisabled || readonly;
          const disabledCls = optionDisabled && classMap.disabled;

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
                className={classMap.checkboxInput}
                id={optionId(id, index)}
                name={htmlName || id}
                checked={checked}
                value={domValues[index]}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={index === autofocusIndex}
                onChange={handleChange}
                onBlur={blurHandlers[index]}
                onFocus={focusHandlers[index]}
                {...optionAttributes}
              />
              <span>{option.label}</span>
            </span>
          );
          return inline ? (
            <label
              // oxlint-disable-next-line react/no-array-index-key
              key={index}
              className={joinClassNames('rjsf-checkbox-inline', classMap.checkboxInlineLabel, disabledCls)}
              data-disabled={optionDisabled || undefined}
            >
              {checkbox}
            </label>
          ) : (
            <div
              // oxlint-disable-next-line react/no-array-index-key
              key={index}
              className={joinClassNames('rjsf-checkbox', classMap.checkboxWrapper, disabledCls)}
              data-disabled={optionDisabled || undefined}
            >
              <label className={classMap.checkboxLabel}>{checkbox}</label>
            </div>
          );
        })}
    </div>
  );
}

export default CheckboxesWidget;
