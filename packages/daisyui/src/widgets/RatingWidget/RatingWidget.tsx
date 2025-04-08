import { ChangeEvent, FocusEvent } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

/** The `RatingWidget` component renders a star or heart rating input with DaisyUI styling
 *
 * Features:
 * - Configurable number of stars/hearts (1-5) with default of 5
 * - Supports different shapes (star, heart)
 * - Supports different colors (red, orange, yellow, lime, green, blue, purple, pink)
 * - Supports different sizes (xs, sm, md, lg, xl)
 * - Uses DaisyUI's mask and star/heart styling
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
  const { stars = 5, shape = 'star', color = 'orange', size = 'md', colorGradient = false } = options;

  const numStars = Math.min(Math.max(stars as number, 1), 5); // Limit between 1-5 stars
  const min = schema.minimum || 0;
  const max = schema.maximum || numStars;

  // Generate shape class
  const maskClass = shape === 'heart' ? 'mask-heart' : 'mask-star-2';

  // Generate size class
  const sizeClass = size === 'md' ? '' : `rating-${size}`;

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

  /** Get color class for a specific star/heart
   *
   * @param index - The index of the star/heart (0-based)
   * @returns The appropriate color class
   */
  const getColorClass = (index: number): string => {
    if (!colorGradient) {
      return `bg-${color}-400`;
    }

    // For gradient effect, use different colors based on position
    const colors = ['red', 'orange', 'yellow', 'lime', 'green'];
    const colorIdx = Math.min(index, colors.length - 1);
    return `bg-${colors[colorIdx]}-400`;
  };

  return (
    <div className='form-control w-full'>
      <div className={`rating gap-1 ${sizeClass}`}>
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
              className={`mask ${maskClass} ${getColorClass(index)}`}
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
