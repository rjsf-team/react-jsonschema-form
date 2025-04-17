import { FocusEvent, useCallback } from 'react';
import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

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
    [value, isEnumeratedObject],
  );

  /** Handles changes to a checkbox's checked state */
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const index = Number(event.target.dataset.index);
      const option = enumOptions?.[index];
      if (!option) {
        return;
      }

      const newValue = Array.isArray(value) ? [...value] : [];
      const optionValue = isEnumeratedObject ? option.value : option.value;

      if (isChecked(option)) {
        onChange(newValue.filter((v) => (isEnumeratedObject ? v.name !== optionValue.name : v !== optionValue)));
      } else {
        onChange([...newValue, optionValue]);
      }
    },
    [onChange, value, isChecked, isEnumeratedObject, enumOptions],
  );

  /** Handles focus events for accessibility */
  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        const index = Number(event.target.dataset.index);
        const option = enumOptions?.[index];
        if (option) {
          onFocus(id, option.value);
        }
      }
    },
    [onFocus, id, enumOptions],
  );

  /** Handles blur events for accessibility */
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        const index = Number(event.target.dataset.index);
        const option = enumOptions?.[index];
        if (option) {
          onBlur(id, option.value);
        }
      }
    },
    [onBlur, id, enumOptions],
  );

  return (
    <div className='form-control'>
      {/* Use a vertical layout with proper spacing */}
      <div className='flex flex-col gap-2 mt-1'>
        {enumOptions?.map((option, index) => (
          <label key={option.value} className='flex items-center cursor-pointer gap-2'>
            <input
              type='checkbox'
              id={`${id}-${option.value}`}
              className='checkbox'
              name={id}
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
