import type { FocusEvent } from 'react';
import { useCallback } from 'react';
import type { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';
import { useTimeWidgetProps } from '@rjsf/utils';

/** The `TimeWidget` component renders a time input with DaisyUI styling
 *
 * Features:
 * - Provides a time picker with hours and minutes
 * - Handles required, disabled, and readonly states
 * - Manages focus and blur events for accessibility
 * - Uses DaisyUI's input styling with proper width
 *
 * On change, the local UTC offset is appended to the value so the stored `time` is compliant with the
 * JSON Schema `time` format (RFC 3339 `full-time`), which requires a timezone; the offset is always stripped
 * back off for display, since a native time input doesn't understand it. This widget never sets a `step`
 * attribute, so the native input always reports minute precision (`HH:MM`); seconds are padded on before the
 * offset is appended, since `full-time` requires seconds. When `schema.format` is `iso-time`, the offset is
 * not added on change, since that format's timezone is optional, but a stored value that happens to carry
 * one is still stripped for display.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TimeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const { id, onChange, onFocus, onBlur, required, disabled, readonly } = props;
  const { localValue: displayValue, computeTimeValue } = useTimeWidgetProps(props);

  /** Handle focus events
   *
   * @param event - The focus event
   */
  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
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
    (event: FocusEvent<HTMLInputElement>) => {
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
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = event.target.value;
      if (!newValue) {
        onChange(newValue);
      } else {
        onChange(computeTimeValue(newValue));
      }
    },
    [computeTimeValue, onChange],
  );

  return (
    <div className='form-control'>
      <input
        type='time'
        id={id}
        className='input input-bordered w-full'
        value={displayValue || ''}
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
