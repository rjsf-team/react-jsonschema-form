import { ChangeEvent, FocusEvent } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

/** The `RatingWidget` component renders a star or heart rating input
 *
 * Features:
 * - Configurable number of stars/hearts (1-5) with default of 5
 * - Supports different shapes (star, heart)
 * - Supports minimum and maximum values from schema
 * - Handles required, disabled, and readonly states
 * - Provides focus and blur event handling for accessibility
 * - Uses radio inputs for a11y compatibility
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RatingWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  id,
  value,
  required,
  disabled,
  readonly,
  autofocus,
  onChange,
  onFocus,
  onBlur,
  schema,
  options,
}: WidgetProps<T, S, F>) {
  const { stars = 5, shape = 'star' } = options;

  // Use schema.maximum if provided, otherwise use stars option (limited to 1-5)
  const numStars = schema.maximum ? Math.min(schema.maximum, 5) : Math.min(Math.max(stars as number, 1), 5);
  const min = schema.minimum || 0;

  /** Handles change events from radio inputs
   *
   * @param event - The change event
   */
  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(value));
  };

  /** Handles focus events for accessibility
   *
   * @param event - The focus event
   * @param starValue - The value of the focused star
   */
  const handleFocus = (event: FocusEvent<HTMLInputElement>, starValue: number) => {
    if (onFocus) {
      onFocus(id, starValue);
    }
  };

  /** Handles blur events for accessibility
   *
   * @param event - The blur event
   * @param starValue - The value of the blurred star
   */
  const handleBlur = (event: FocusEvent<HTMLInputElement>, starValue: number) => {
    if (onBlur) {
      onBlur(id, starValue);
    }
  };

  return (
    <div className='field field-array'>
      <div className='rating'>
        {[...Array(numStars)].map((_, index) => {
          const starValue = min + index;
          return (
            <input
              key={index}
              type='radio'
              name={id}
              value={starValue}
              checked={value === starValue}
              onChange={_onChange}
              onFocus={(e) => handleFocus(e, starValue)}
              onBlur={(e) => handleBlur(e, starValue)}
              className='rating-input'
              disabled={disabled || readonly}
              required={required}
              autoFocus={autofocus && index === 0}
              aria-label={`${starValue} ${shape === 'heart' ? 'heart' : 'star'}${starValue === 1 ? '' : 's'}`}
            />
          );
        })}
      </div>
    </div>
  );
}
