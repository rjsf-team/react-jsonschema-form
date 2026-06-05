import type { FocusEvent } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, rangeSpec } from '@rjsf/utils';
import type { SliderChangeEvent } from 'primereact/slider';
import { Slider } from 'primereact/slider';

/** The `RangeWidget` component uses the `Slider` from PrimeReact, wrapping the result
 * in a div, with the value alongside it.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RangeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const { value, readonly, disabled, onBlur, onFocus, options, schema, onChange, id } = props;
  const primeProps = (options.prime || {}) as object;
  const sliderProps = { value, id, ...rangeSpec<S>(schema) };

  const handleChange = (e: SliderChangeEvent) => {
    onChange(e.value ?? options.emptyValue);
  };
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target && target.value);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target && target.value);

  return (
    <Slider
      {...primeProps}
      disabled={disabled || readonly}
      onMouseDown={(e) => e.stopPropagation()}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      {...sliderProps}
      aria-describedby={ariaDescribedByIds(id)}
    />
  );
}
