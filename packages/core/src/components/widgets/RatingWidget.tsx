import type { FocusEvent, KeyboardEvent } from 'react';
import { useCallback, useLayoutEffect, useRef } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getGroupAttributes, numericWidgetStoresString, toInputValue, toNumericValue } from '@rjsf/utils';

/** How far each key moves from the focused star, choosing the star it lands on */
const STAR_KEY_STEPS: Partial<Record<string, number>> = {
  Enter: 0,
  ' ': 0,
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

/** Drops binary floating point's noise: `2.3 - 1.3` falls just short of 1, which would lose the last star, and
 * `0.57 + 1` misses 1.57, so a stored 1.57 would check no star
 */
const withoutFloatNoise = (number: number) => Number(number.toFixed(9));

/** The `RatingWidget` component renders a star or heart rating input
 *
 * Features:
 * - Configurable number of stars/hearts (1-5) with default of 5
 * - Supports different shapes (star, heart)
 * - Supports minimum and maximum values from schema
 * - Handles required, disabled, and readonly states
 * - Provides focus and blur event handling for accessibility
 * - Uses Unicode characters for better visual representation
 * - Renders its stars as a `radiogroup`, named and described by its field's plan, as `RadioWidget` is: one tab stop,
 *   whose arrow keys move to and check the next or previous star
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RatingWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  id,
  value,
  required,
  disabled,
  readonly,
  autofocus = false,
  onChange,
  onFocus,
  onBlur,
  schema,
  options,
  htmlName,
  presentation,
}: WidgetProps<T, S, F>) {
  const { stars = 5, shape = 'star' } = options;
  const { group: groupAttributes, option: optionAttributes } = getGroupAttributes<T, S, F>(
    { id, presentation },
    'radiogroup',
  );

  // A JSON uiSchema can hold `stars` as a numeric string, which reads as its number, or as anything else, which shows
  // the default 5
  const starsOption: unknown = stars;
  const starCount = Number(starsOption);
  // Use schema.maximum if provided, otherwise use stars option (limited to 1-5)
  const numStars = schema.maximum
    ? Math.min(schema.maximum, 5)
    : Math.min(Math.max(Number.isFinite(starCount) ? starCount : 5, 1), 5);
  const min = schema.minimum ?? 0;
  const storesString = numericWidgetStoresString<S>(schema, value);
  const rating = toNumericValue(value);
  const numStars = Math.floor(
    Math.max(Math.min(withoutFloatNoise((schema.maximum ?? Infinity) - min + 1), stars, 5), 1),
  );
  const starValues = Array.from({ length: numStars }, (_, index) => withoutFloatNoise(min + index));
  // The checked star, as `RadioWidget` gives it its checked radio, else the first
  const tabStopIndex = Math.max(
    starValues.findIndex((starValue) => starValue === rating),
    0,
  );
  // React acts on `autoFocus` only for a form control, which a star isn't, so the star takes focus as it mounts, in the
  // same commit phase as `autoFocus` would give it, and not when `ui:autofocus` turns on later. A disabled or read-only
  // rating takes none, as its stars are out of the tab order
  const autofocusStar = useRef<HTMLSpanElement>(null);
  const focusOnMount = useRef(autofocus && !disabled && !readonly);
  useLayoutEffect(() => {
    if (focusOnMount.current) {
      focusOnMount.current = false;
      autofocusStar.current?.focus();
    }
  }, []);

  /** Handles clicking on a star to set the rating */
  const handleStarClick = useCallback(
    (starValue: number) => {
      if (!disabled && !readonly) {
        onChange(storesString ? String(starValue) : starValue);
      }
    },
    [onChange, disabled, readonly, storesString],
  );

  /** Handles the keys a radio group answers to, leaving a browser's own shortcuts, such as Alt+Left, alone */
  const handleStarKeyDown = (event: KeyboardEvent<HTMLSpanElement>, index: number) => {
    const step = STAR_KEY_STEPS[event.key];
    if (step === undefined || disabled || readonly || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    event.preventDefault();
    const nextIndex = (index + step + numStars) % numStars;
    handleStarClick(starValues[nextIndex]);
    event.currentTarget.parentElement?.querySelectorAll<HTMLElement>('[role="radio"]')[nextIndex].focus();
  };

  /** Handles focus events for accessibility */
  const handleFocus = useCallback(
    (event: FocusEvent<HTMLSpanElement>) => {
      if (onFocus) {
        // Get the star value from the data attribute
        const starValue = Number(event.target.dataset.value);
        onFocus(id, starValue);
      }
    },
    [onFocus, id],
  );

  /** Handles blur events for accessibility */
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLSpanElement>) => {
      if (onBlur) {
        // Get the star value from the data attribute
        const starValue = Number(event.target.dataset.value);
        onBlur(id, starValue);
      }
    },
    [onBlur, id],
  );

  // Get the appropriate Unicode character based on shape option
  const getSymbol = (isFilled: boolean): string => {
    if (shape === 'heart') {
      return isFilled ? '♥' : '♡';
    }
    return isFilled ? '★' : '☆';
  };

  return (
    <div
      id={id}
      className='rjsf-rating-widget'
      {...groupAttributes}
      aria-required={required || undefined}
      aria-disabled={disabled || undefined}
      aria-readonly={readonly || undefined}
      style={{
        display: 'inline-flex',
        fontSize: '1.5rem',
        cursor: disabled || readonly ? 'default' : 'pointer',
      }}
    >
      {Array.from({ length: numStars }, (_, index) => {
        const starValue = min + index;
        const isFilled = rating !== undefined && starValue <= rating;

        return (
          <span
            key={index}
            ref={index === tabStopIndex ? autofocusStar : undefined}
            onClick={() => handleStarClick(starValue)}
            onKeyDown={(event) => handleStarKeyDown(event, index)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            data-value={starValue}
            tabIndex={!disabled && !readonly && index === tabStopIndex ? 0 : -1}
            role='radio'
            aria-checked={starValue === rating}
            aria-label={`${starValue} ${shape === 'heart' ? 'heart' : 'star'}${starValue === 1 ? '' : 's'}`}
            {...optionAttributes}
            style={{
              color: isFilled ? '#FFD700' : '#ccc',
              padding: '0 0.2rem',
              transition: 'color 0.2s',
              userSelect: 'none',
            }}
          >
            {getSymbol(isFilled)}
          </span>
        );
      })}
      <input
        type='hidden'
        name={htmlName || id}
        value={toInputValue(value)}
        required={required}
        disabled={disabled || readonly}
        aria-hidden='true'
      />
    </div>
  );
}
