import { ChangeEvent } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

export default function RatingWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({ id, value, required, disabled, readonly, autofocus, onChange, schema, options }: WidgetProps<T, S, F>) {
  const { stars = 5 } = options;
  const numStars = Math.min(Math.max(stars as number, 1), 5); // Limit between 1-5 stars
  const min = schema.minimum || 0;
  const max = schema.maximum || numStars;

  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(value));
  };

  return (
    <div className='form-control w-full'>
      <div className='rating gap-1'>
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
              className='mask mask-star-2 bg-orange-400'
              disabled={disabled || readonly}
              required={required}
              autoFocus={autofocus && index === 0}
              aria-label={`${starValue} star${starValue === 1 ? '' : 's'}`}
            />
          );
        })}
      </div>
    </div>
  );
}
