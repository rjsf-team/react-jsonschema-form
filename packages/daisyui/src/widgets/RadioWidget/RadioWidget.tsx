import { WidgetProps, StrictRJSFSchema, FormContextType, RJSFSchema } from '@rjsf/utils';
import { FocusEvent } from 'react';

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
  options,
  value,
  required,
  disabled,
  readonly,
  label,
  onChange,
  onFocus,
  onBlur,
}: WidgetProps<T, S, F>) {
  const { enumOptions } = options;
  const isEnumeratedObject = enumOptions && enumOptions[0]?.value && typeof enumOptions[0].value === 'object';

  /** Gets the actual value from an option
   *
   * @param option - The option object to get value from
   * @returns The option's value
   */
  const getValue = (option: any) => {
    return option.value;
  };

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

  /** Handles focus events for accessibility
   *
   * @param event - The focus event
   * @param optionValue - The value of the focused option
   */
  const handleFocus = (event: FocusEvent<HTMLInputElement>, optionValue: any) => {
    if (onFocus) {
      onFocus(id, optionValue);
    }
  };

  /** Handles blur events for accessibility
   *
   * @param event - The blur event
   * @param optionValue - The value of the blurred option
   */
  const handleBlur = (event: FocusEvent<HTMLInputElement>, optionValue: any) => {
    if (onBlur) {
      onBlur(id, optionValue);
    }
  };

  return (
    <div className='form-control'>
      {/* Display the options in a vertical flex layout for better spacing */}
      <div className='flex flex-col gap-2 mt-1'>
        {enumOptions?.map((option) => (
          <label key={option.value} className='flex items-center cursor-pointer gap-2'>
            <input
              type='radio'
              id={`${id}-${option.value}`}
              className='radio'
              name={id}
              value={getValue(option)}
              checked={isChecked(option)}
              required={required}
              disabled={disabled || readonly}
              onChange={(e) => {
                onChange(isEnumeratedObject ? option.value : option.value);
                e.target.blur();
              }}
              onFocus={(e) => handleFocus(e, option.value)}
              onBlur={(e) => handleBlur(e, option.value)}
            />
            <span className='label-text'>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
