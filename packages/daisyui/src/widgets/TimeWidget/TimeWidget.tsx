import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import { FocusEvent, useCallback } from 'react';

/** The `TimeWidget` component renders a time input with DaisyUI styling
 *
 * Features:
 * - Provides a time picker with hours and minutes
 * - Handles required, disabled, and readonly states
 * - Manages focus and blur events for accessibility
 * - Uses DaisyUI's input styling with proper width
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TimeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const { id, value, onChange, onFocus, onBlur, required, disabled, readonly } = props;

  /** Handle focus events
   *
   * @param event - The focus event
   */
  const handleFocus = (event: FocusEvent<HTMLInputElement>) => {
    if (onFocus) {
      onFocus(id, event.target.value);
    }
  };

  /** Handle blur events
   *
   * @param event - The blur event
   */
  const handleBlur = (event: FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      onBlur(id, event.target.value);
    }
  };

  /** Handle change events
   *
   * @param event - The change event
   */
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange]
  );

  return (
    <div className='form-control'>
      <input
        type='time'
        id={id}
        className='input input-bordered w-full'
        value={value || ''}
        required={required}
        disabled={disabled || readonly}
        readOnly={readonly}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    </div>
  );
}
