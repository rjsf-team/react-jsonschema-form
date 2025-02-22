import { FocusEvent } from 'react';
import { Slider, SliderChangeEvent } from 'primereact/slider';
import { ariaDescribedByIds, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps, rangeSpec } from '@rjsf/utils';

/** The `RangeWidget` component uses the `Slider` from PrimeReact, wrapping the result
 * in a div, with the value alongside it.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RangeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const { value, readonly, disabled, onBlur, onFocus, options, schema, onChange, id } = props;
  const sliderProps = { value, id, ...rangeSpec<S>(schema) };

  const _onChange = (e: SliderChangeEvent) => {
    onChange(e.value ?? options.emptyValue);
  };
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target && target.value);
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target && target.value);

  return (
    <>
      <Slider
        disabled={disabled || readonly}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        {...sliderProps}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
    </>
  );
}
