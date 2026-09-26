import type { FocusEvent } from 'react';
import { useCallback, useMemo } from 'react';
import type { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import {
  enumOptionsDeselectValue,
  enumOptionsIsSelected,
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  getOptionValueFormat,
  optionId,
} from '@rjsf/utils';

/** The `CheckboxesWidget` component renders a set of checkboxes for multiple choice selection
 * with DaisyUI styling.
 *
 * Features:
 * - Supports both primitive values and objects in enum options
 * - Handles array values with proper state management
 * - Uses DaisyUI checkbox styling with accessible labels
 * - Supports disabled and readonly states
 * - Provides focus and blur event handling for accessibility
 * - Uses vertical layout for better spacing and readability
 * - Uses memoized handlers for optimal performance
 *
 * @param props - The `WidgetProps` for this component
 */
export default function CheckboxesWidget<
  T,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({ id, htmlName, disabled, options, value, readonly, required, onChange, onFocus, onBlur }: WidgetProps<T, S, F>) {
  const { enumOptions, emptyValue } = options;
  const optionValueFormat = getOptionValueFormat(options);
  const selected = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  /** Handles changes to a checkbox's checked state */
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const index = Number(event.target.dataset.index);
      const option = enumOptions?.[index];
      if (!option) {
        return;
      }

      // Compared by value, since an object option in form data is rarely the same instance as the option's constant
      if (enumOptionsIsSelected<S>(option.value, selected)) {
        onChange(enumOptionsDeselectValue<S>(index, selected, enumOptions));
      } else {
        onChange([...selected, option.value]);
      }
    },
    [onChange, selected, enumOptions],
  );

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

  return (
    <div className='form-control'>
      {/* Use a vertical layout with proper spacing */}
      <div className='flex flex-col gap-2 mt-1'>
        {enumOptions?.map((option, index) => (
          // oxlint-disable-next-line react/no-array-index-key
          <label key={index} className='flex items-center cursor-pointer gap-2'>
            <input
              type='checkbox'
              id={optionId(id, index)}
              className='checkbox'
              name={htmlName || id}
              value={enumOptionValueEncoder(option.value, index, optionValueFormat)}
              checked={enumOptionsIsSelected<S>(option.value, selected)}
              required={required}
              disabled={disabled || readonly}
              data-index={index}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            <span className='label-text'>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
