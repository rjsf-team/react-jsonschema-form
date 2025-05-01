import { FocusEvent, useCallback } from 'react';
import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

/** The `TextareaWidget` component renders a multi-line text input with DaisyUI styling
 *
 * Features:
 * - Handles multi-line text input with proper styling
 * - Supports required, disabled, and readonly states
 * - Manages focus and blur events for accessibility
 * - Uses DaisyUI's textarea component for consistent styling
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TextareaWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const { id, value, required, disabled, readonly, onChange, onFocus, onBlur, options } = props;

  /** Handle focus events
   *
   * @param event - The focus event
   */
  const handleFocus = useCallback(
    (event: FocusEvent<HTMLTextAreaElement>) => {
      if (onFocus) {
        onFocus(id, event.target.value);
      }
    },
    [onFocus, id],
  );

  /** Handle blur events
   *
   * @param event - The blur event
   */
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLTextAreaElement>) => {
      if (onBlur) {
        onBlur(id, event.target.value);
      }
    },
    [onBlur, id],
  );

  /** Handle change events
   *
   * @param event - The change event
   */
  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  // Extract rows and other textarea-specific props from options
  const rows = options?.rows || 5;

  return (
    <div className='form-control'>
      <textarea
        id={id}
        value={value || ''}
        required={required}
        disabled={disabled || readonly}
        readOnly={readonly}
        rows={rows}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className='textarea textarea-bordered w-full'
      />
    </div>
  );
}
