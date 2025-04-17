import { FocusEvent, useCallback } from 'react';
import { WidgetProps, StrictRJSFSchema, FormContextType, RJSFSchema } from '@rjsf/utils';

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

  /** Handles focus events for accessibility */
  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        const index = Number(event.target.dataset.index);
        const optionValue = enumOptions?.[index]?.value;
        onFocus(id, optionValue);
      }
    },
    [onFocus, id, enumOptions],
  );

  /** Handles blur events for accessibility */
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        const index = Number(event.target.dataset.index);
        const optionValue = enumOptions?.[index]?.value;
        onBlur(id, optionValue);
      }
    },
    [onBlur, id, enumOptions],
  );

  /** Handles change events for radio options */
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const index = Number(event.target.dataset.index);
      const option = enumOptions?.[index];
      if (option) {
        onChange(isEnumeratedObject ? option.value : option.value);
        event.target.blur();
      }
    },
    [onChange, isEnumeratedObject, enumOptions],
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
              name={id}
              value={getValue(option)}
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
