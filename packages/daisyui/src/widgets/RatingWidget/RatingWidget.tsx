import type { ChangeEvent, FocusEvent } from 'react';
import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { numericWidgetStoresString, toNumericValue, widgetDrawsLabel } from '@rjsf/utils';

import { getGroupAndOptionProps } from '../../utils.ts';

/** Drops binary floating point's noise: `2.3 - 1.3` falls just short of 1, which would lose the last star, and
 * `0.57 + 1` misses 1.57, so a stored 1.57 would check no star
 */
const withoutFloatNoise = (number: number) => Number(number.toFixed(9));

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
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    value,
    label,
    presentation,
    required,
    disabled,
    readonly,
    autofocus,
    onChange,
    onFocus,
    onBlur,
    schema,
    options,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const { stars = 5, shape = 'star', color, size, colorGradient = false } = options;

  // A JSON uiSchema can hold `stars` as a numeric string, which reads as its number, or as anything else, which shows
  // the default 5
  const starsOption: unknown = stars;
  const starCount = Number(starsOption);
  // Use schema.maximum if provided, otherwise use stars option (limited to 1-5), rounded down to the stars that render
  const numStars = Math.floor(
    schema.maximum ? Math.min(schema.maximum, 5) : Math.min(Math.max(Number.isFinite(starCount) ? starCount : 5, 1), 5),
  );
  const min = schema.minimum ?? 0;
  const storesString = numericWidgetStoresString<S>(schema, value);
  const rating = toNumericValue(value);
  const numStars = Math.floor(
    Math.max(Math.min(withoutFloatNoise((schema.maximum ?? Infinity) - min + 1), stars, 5), 1),
  );
  const starValues = Array.from({ length: numStars }, (_, index) => withoutFloatNoise(min + index));

  // Generate shape class
  const maskClass = shape === 'heart' ? 'mask-heart' : 'mask-star-2';

  // Generate size class
  const sizeClass = typeof size === 'string' && size !== 'md' ? `rating-${size}` : '';

  /** Handles change events from radio inputs */
  const handleChange = useCallback(
    ({ target: { value: newValue } }: ChangeEvent<HTMLInputElement>) => {
      const starValue = Number(newValue);
      onChange(storesString ? String(starValue) : starValue);
    },
    [onChange, storesString],
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
      return `bg-${typeof color === 'string' ? color : 'orange'}-400`;
    }

    // For gradient effect, use different colors based on position
    const colors = ['red', 'orange', 'yellow', 'lime', 'green'];
    const colorIdx = Math.min(index, colors.length - 1);
    return `bg-${colors[colorIdx]}-400`;
  };

  const { group: groupProps, option: optionAttributes } = getGroupAndOptionProps({
    id,
    label,
    hideLabel,
    presentation,
    role: 'radiogroup',
  });

  // The checked star, where Tab into the group lands, as `RadioWidget` gives it its checked radio, else the first
  const autofocusValue = rating !== undefined && starValues.includes(rating) ? rating : starValues[0];

  return (
    <div className='form-control w-full'>
      <div className={`rating gap-1 ${sizeClass}`} {...groupProps}>
        {Array.from({ length: numStars }, (_, index) => {
          const starValue = min + index;
          return (
            <input
              key={index}
              type='radio'
              name={htmlName || id}
              value={starValue}
              checked={rating === starValue}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              className={`mask ${maskClass} ${getColorClass(index)}`}
              disabled={disabled || readonly}
              required={required}
              autoFocus={autofocus && starValue === autofocusValue}
              aria-label={`${starValue} ${shape === 'heart' ? 'heart' : 'star'}${starValue === 1 ? '' : 's'}`}
              {...optionAttributes}
            />
          );
        })}
      </div>
    </div>
  );
}
