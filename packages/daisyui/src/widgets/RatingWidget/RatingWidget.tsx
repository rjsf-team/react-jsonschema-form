import type { ChangeEvent, FocusEvent } from 'react';
import { useCallback } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { numericWidgetStoresString, rangeSpec, ratingStarCount, toNumericValue, widgetDrawsLabel } from '@rjsf/utils';

import { classNameOption, getGroupAndOptionProps } from '../../utils.ts';

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
  const { stars, shape = 'star', colorGradient } = options;
  const size = classNameOption(options.size);
  const color = classNameOption(options.color) ?? 'orange';

  const { min = 0 } = rangeSpec<S>(schema);
  const storesString = numericWidgetStoresString<S>(schema, value);
  const rating = toNumericValue(value);
  const numStars = ratingStarCount<S>(schema, stars);
  const starValues = Array.from({ length: numStars }, (_, index) => withoutFloatNoise(min + index));

  // Generate shape class
  const maskClass = shape === 'heart' ? 'mask-heart' : 'mask-star-2';

  // Generate size class
  const sizeClass = size === undefined || size === 'md' ? '' : `rating-${size}`;

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
    if (colorGradient !== true) {
      return `bg-${color}-400`;
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
        {starValues.map((starValue, index) => (
          <input
            // oxlint-disable-next-line react/no-array-index-key
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
        ))}
      </div>
    </div>
  );
}
