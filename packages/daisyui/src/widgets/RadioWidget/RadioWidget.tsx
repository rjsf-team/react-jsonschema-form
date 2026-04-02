import { FocusEvent, useCallback } from 'react';
import {
  enumOptionValueDecoder,
  enumOptionValueEncoder,
  WidgetProps,
  StrictRJSFSchema,
  FormContextType,
  RJSFSchema,
} from '@rjsf/utils';

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
export default function RadioWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  htmlName,
  options,
  value,
  required,
  disabled,
  readonly,
  onChange,
  onFocus,
  onBlur,
}: WidgetProps<T, S, F>) {
  const { enumOptions, emptyValue } = options;
  const useRealValues = !!options.useRealOptionValues;
  const isEnumeratedObject = enumOptions && enumOptions[0]?.value && typeof enumOptions[0].value === 'object';

  /** Determines if an option is checked based on the current value
   *
   * @param option - The option to check
   * @returns Whether the option should be checked
   */
  const isChecked = (option: any) => {
    if (isEnumeratedObject) {
      return value && value.name === option.value.name;
    }
    return value === option.value;
  };

  /** Handles focus events for accessibility */
  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, enumOptionValueDecoder<S>(event.target.value, enumOptions, useRealValues, emptyValue));
      }
    },
    [onFocus, id, enumOptions, useRealValues, emptyValue],
  );

  /** Handles blur events for accessibility */
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, enumOptionValueDecoder<S>(event.target.value, enumOptions, useRealValues, emptyValue));
      }
    },
    [onBlur, id, enumOptions, useRealValues, emptyValue],
  );

  /** Handles change events for radio options */
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const decoded = enumOptionValueDecoder<S>(event.target.value, enumOptions, useRealValues, emptyValue);
      if (decoded !== undefined) {
        onChange(decoded);
        event.target.blur();
      }
    },
    [onChange, enumOptions, useRealValues, emptyValue],
  );

  return (
    <div className='form-control'>
      {/* Display the options in a vertical flex layout for better spacing */}
      <div className='flex flex-col gap-2 mt-1'>
        {enumOptions?.map((option, index) => (
          <label key={option.value} className='flex items-center cursor-pointer gap-2'>
            <input
              type='radio'
              id={`${id}-${option.value}`}
              className='radio'
              name={htmlName || id}
              value={enumOptionValueEncoder(option.value, index, useRealValues)}
              checked={isChecked(option)}
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
