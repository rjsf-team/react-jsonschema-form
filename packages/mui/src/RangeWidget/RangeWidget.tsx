import { FocusEvent } from 'react';
import FormLabel from '@mui/material/FormLabel';
import Slider from '@mui/material/Slider';
import {
  ariaDescribedByIds,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  rangeSpec,
} from '@rjsf/utils';

/** The `RangeWidget` component uses the `BaseInputTemplate` changing the type to `range` and wrapping the result
 * in a div, with the value along side it.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RangeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
  const { value, readonly, disabled, onBlur, onFocus, options, schema, onChange, required, label, hideLabel, id } =
    props;
  const sliderProps = { value, label, id, name: id, ...rangeSpec<S>(schema) };

  const _onChange = (_: any, value?: number | number[]) => {
    onChange(value ?? options.emptyValue);
  };
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target && target.value);
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target && target.value);

  return (
    <>
      {labelValue(
        <FormLabel required={required} htmlFor={id}>
          {label || undefined}
        </FormLabel>,
        hideLabel
      )}
      <Slider
        disabled={disabled || readonly}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        valueLabelDisplay='auto'
        {...sliderProps}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
    </>
  );
}
