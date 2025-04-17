import { ChangeEvent, useCallback } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

/** The `ToggleWidget` component renders a toggle switch input with DaisyUI styling
 *
 * Features:
 * - Provides a visual toggle switch rather than a standard checkbox
 * - Supports different sizes through options (sm, md, lg)
 * - Handles required, disabled, and readonly states
 * - Manages focus and blur events for accessibility
 * - Includes an optional label from options
 *
 * @param props - The `WidgetProps` for this component
 */
export default function ToggleWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ id, value, required, disabled, readonly, autofocus, onChange, onFocus, onBlur, options }: WidgetProps<T, S, F>) {
  /** Handle change events from the toggle input
   *
   * @param event - The change event
   */
  const _onChange = useCallback(
    ({ target: { checked } }: ChangeEvent<HTMLInputElement>) => onChange(checked),
    [onChange],
  );

  /** Handle focus events
   */
  const handleFocus = useCallback(() => {
    if (onFocus) {
      onFocus(id, value);
    }
  }, [onFocus, id, value]);

  /** Handle blur events
   */
  const handleBlur = useCallback(() => {
    if (onBlur) {
      onBlur(id, value);
    }
  }, [onBlur, id, value]);

  // Get size from options or use default "md"
  const { size = 'md' } = options;

  // Only add size class if it's not the default size
  const sizeClass = size !== 'md' ? `toggle-${size}` : '';

  return (
    <div className='form-control'>
      <label className='cursor-pointer label my-auto'>
        <input
          type='checkbox'
          id={id}
          checked={value}
          required={required}
          disabled={disabled || readonly}
          autoFocus={autofocus}
          onChange={_onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={`toggle ${sizeClass}`}
        />
        <span className='label-text'>{options.label}</span>
      </label>
    </div>
  );
}
