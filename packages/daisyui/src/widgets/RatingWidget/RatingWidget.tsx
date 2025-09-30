import { ChangeEvent, FocusEvent, useCallback } from 'react';
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
  F extends FormContextType = any,
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

  // Use schema.maximum if provided, otherwise use stars option (limited to 1-5)
  const numStars = schema.maximum ? Math.min(schema.maximum, 5) : Math.min(Math.max(stars as number, 1), 5);
  const min = schema.minimum || 0;

  // Generate shape class
  const maskClass = shape === 'heart' ? 'mask-heart' : 'mask-star-2';

  // Generate size class
  const sizeClass = size === 'md' ? '' : `rating-${size}`;

  /** Handles change events from radio inputs */
  const _onChange = useCallback(
    ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
      onChange(parseInt(value));
    },
    [onChange],
  );

  /** Handles focus events for accessibility */
  const handleFocus = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        const starValue = Number(event.target.value);
        onFocus(id, starValue);
      }
    },
    [onFocus, id],
  );

  /** Handles blur events for accessibility */
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        const starValue = Number(event.target.value);
        onBlur(id, starValue);
      }
    },
    [onBlur, id],
  );

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
              onFocus={handleFocus}
              onBlur={handleBlur}
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
