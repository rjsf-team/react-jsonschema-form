import type { FocusEvent } from 'react';
import { useCallback } from 'react';
import type { WidgetProps, StrictRJSFSchema, FormContextType, RJSFSchema } from '@rjsf/utils';
import {
  enumOptionsAutofocusIndex,
  enumOptionsDomValues,
  enumOptionsIsDisabled,
  enumOptionsIsSelected,
  enumOptionValueDecoder,
  getOptionValueFormat,
  optionId,
  widgetDrawsLabel,
} from '@rjsf/utils';

import { getGroupAndOptionProps, getOptionClassNames } from '../../utils.ts';

/** The `RadioWidget` component renders a group of radio buttons with DaisyUI styling
 *
 * Features:
 * - Supports both primitive values and objects in enum options
 * - Handles selection state for various data types
 * - Uses DaisyUI radio styling with accessible labels
 * - Supports disabled and readonly states
 * - Provides focus and blur event handling
 * - Renders radio buttons in a vertical layout for better spacing
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RadioWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    options,
    value,
    label,
    presentation,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onFocus,
    onBlur,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const { enumOptions, enumDisabled, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const domValues = enumOptionsDomValues<S>(enumOptions, optionValueFormat);

  /** Handles focus events for accessibility */
  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, enumOptionValueDecoder<S>(event.target.value, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onFocus, id, enumOptions, optionValueFormat, emptyValue],
  );

  /** Handles blur events for accessibility */
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, enumOptionValueDecoder<S>(event.target.value, enumOptions, optionValueFormat, emptyValue));
      }
    },
    [onBlur, id, enumOptions, optionValueFormat, emptyValue],
  );

  /** Handles change events for radio options */
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const decoded = enumOptionValueDecoder<S>(event.target.value, enumOptions, optionValueFormat, emptyValue);
      if (decoded !== undefined) {
        onChange(decoded);
        event.target.blur();
      }
    },
    [onChange, enumOptions, optionValueFormat, emptyValue],
  );

  const { group: groupProps, option: optionAttributes } = getGroupAndOptionProps({
    id,
    label,
    hideLabel,
    presentation,
    role: 'radiogroup',
  });

  const autofocusIndex = enumOptionsAutofocusIndex<S>(enumOptions, enumDisabled, autofocus, value);
  return (
    <div className='form-control'>
      {/* Display the options in a vertical flex layout for better spacing */}
      <div className='flex flex-col gap-2 mt-1' {...groupProps}>
        {enumOptions?.map((option, index) => {
          const optionDisabled = disabled || readonly || enumOptionsIsDisabled(option.value, enumDisabled);
          const classNames = getOptionClassNames(optionDisabled);
          return (
            <label
              // oxlint-disable-next-line react/no-array-index-key
              key={index}
              className={classNames.label}
            >
              <input
                type='radio'
                id={optionId(id, index)}
                className='radio'
                name={htmlName || id}
                value={domValues[index]}
                checked={enumOptionsIsSelected<S>(option.value, value, false)}
                required={required}
                disabled={optionDisabled}
                autoFocus={index === autofocusIndex}
                data-index={index}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                {...optionAttributes}
              />
              <span className={classNames.text}>{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
