import type { FocusEvent } from 'react';
import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  enumOptionsAutofocusIndex,
  enumOptionsIsDisabled,
  enumOptionValueDecoder,
  enumOptionsDomValues,
  enumOptionsIsSelected,
  getGroupAttributes,
  getOptionValueFormat,
  optionId,
} from '@rjsf/utils';
import { clsx } from 'clsx';

/** The `RadioWidget` is a widget for rendering a radio group.
 *  It is typically used with a string property constrained with enum options.
 *
 * @param props - The `WidgetProps` for this component
 */
function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
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
  htmlName,
  registry,
  presentation,
}: WidgetProps<T, S, F>) {
  const { enumOptions, enumDisabled, inline, emptyValue } = options;
  const { classMap } = registry;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) =>
      onBlur(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue)),
    [onBlur, enumOptions, emptyValue, id, optionValueFormat],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) =>
      onFocus(id, enumOptionValueDecoder<S>(target?.value, enumOptions, optionValueFormat, emptyValue)),
    [onFocus, enumOptions, emptyValue, id, optionValueFormat],
  );

  const { group: groupAttributes, option: optionAttributes } = getGroupAttributes<T, S, F>(
    { id, presentation },
    'radiogroup',
  );
  const autofocusIndex = enumOptionsAutofocusIndex<S>(enumOptions, enumDisabled, autofocus, value);
  return (
    <div className='field-radio-group' id={id} {...groupAttributes}>
      {Array.isArray(enumOptions) &&
        enumOptions.map((option, i) => {
          const checked = enumOptionsIsSelected<S>(option.value, value, false);
          const itemDisabled = enumOptionsIsDisabled(option.value, enumDisabled);
          const disabledCls = (disabled || itemDisabled || readonly) && classMap.disabled;

          const handleChange = () => onChange(option.value);

          const radio = (
            <span>
              <input
                type='radio'
                className={classMap.radioInput || undefined}
                id={optionId(id, i)}
                checked={checked}
                name={htmlName || id}
                required={required}
                value={domValues[i]}
                disabled={disabled || itemDisabled || readonly}
                autoFocus={i === autofocusIndex}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                {...optionAttributes}
              />
              <span>{option.label}</span>
            </span>
          );

          return inline ? (
            // oxlint-disable-next-line react/no-array-index-key
            <label key={i} className={clsx(classMap.radioInlineLabel, disabledCls)}>
              {radio}
            </label>
          ) : (
            // oxlint-disable-next-line react/no-array-index-key
            <div key={i} className={clsx(classMap.radioWrapper, disabledCls)}>
              <label className={classMap.radioLabel || undefined}>{radio}</label>
            </div>
          );
        })}
    </div>
  );
}

export default RadioWidget;
