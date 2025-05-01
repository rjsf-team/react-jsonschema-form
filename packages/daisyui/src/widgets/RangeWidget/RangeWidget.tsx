import { FocusEvent, useCallback } from 'react';
import { WidgetProps, StrictRJSFSchema, RJSFSchema, FormContextType } from '@rjsf/utils';

/** The `RangeWidget` component renders a range slider input with DaisyUI styling
 *
 * Features:
 * - Visual slider control for numerical values
 * - Displays current value next to the slider
 * - Supports min, max, and step attributes from schema
 * - Handles required, disabled, and readonly states
 * - Supports focus and blur events for accessibility
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RangeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  value,
  required,
  disabled,
  readonly,
  onChange,
  onFocus,
  onBlur,
  schema,
}: WidgetProps<T, S, F>) {
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
    [onChange],
  );

  return (
    <div className='form-control'>
      <div className='flex items-center'>
        <input
          type='range'
          id={id}
          className='range'
          value={value || schema.default}
          required={required}
          disabled={disabled || readonly}
          min={schema.minimum}
          max={schema.maximum}
          step={schema.multipleOf || 1}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <span className='label-text ml-4'>{value}</span>
      </div>
    </div>
  );
}
