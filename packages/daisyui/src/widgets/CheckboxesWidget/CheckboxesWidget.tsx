import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import { FocusEvent, useCallback } from 'react';

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
export default function CheckboxesWidget<T, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  disabled,
  options,
  value,
  readonly,
  required,
  onChange,
  onFocus,
  onBlur,
}: WidgetProps<T, S, F>) {
  const { enumOptions } = options;
  const isEnumeratedObject = enumOptions && enumOptions[0]?.value && typeof enumOptions[0].value === 'object';

  /** Determines if a checkbox option should be checked based on the current value
   *
   * @param option - The option to check
   * @returns Whether the option should be checked
   */
  const isChecked = useCallback(
    (option: any) => {
      if (!Array.isArray(value)) {
        return false;
      }
      if (isEnumeratedObject) {
        return value.some((v) => v.name === option.value.name);
      }
      return value.includes(option.value);
    },
    [value, isEnumeratedObject]
  );

  /** Handles changes to a checkbox's checked state
   *
   * @param option - The option that was changed
   */
  const _onChange = useCallback(
    (option: any) => {
      const newValue = Array.isArray(value) ? [...value] : [];
      const optionValue = isEnumeratedObject ? option.value : option.value;

      if (isChecked(option)) {
        onChange(newValue.filter((v) => (isEnumeratedObject ? v.name !== optionValue.name : v !== optionValue)));
      } else {
        onChange([...newValue, optionValue]);
      }
    },
    [onChange, value, isChecked, isEnumeratedObject]
  );

  /** Handles focus events for accessibility
   *
   * @param event - The focus event
   * @param option - The option being focused
   */
  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>, option: any) => {
      if (onFocus) {
        onFocus(id, option.value);
      }
    },
    [onFocus, id]
  );

  /** Handles blur events for accessibility
   *
   * @param event - The blur event
   * @param option - The option being blurred
   */
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>, option: any) => {
      if (onBlur) {
        onBlur(id, option.value);
      }
    },
    [onBlur, id]
  );

  return (
    <div className='form-control'>
      {/* Use a vertical layout with proper spacing */}
      <div className='flex flex-col gap-2 mt-1'>
        {enumOptions?.map((option) => (
          <label key={option.value} className='flex items-center cursor-pointer gap-2'>
            <input
              type='checkbox'
              id={`${id}-${option.value}`}
              className='checkbox'
              name={id}
              checked={isChecked(option)}
              required={required}
              disabled={disabled || readonly}
              onChange={() => _onChange(option)}
              onFocus={(e) => handleFocus(e, option)}
              onBlur={(e) => handleBlur(e, option)}
            />
            <span className='label-text'>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
