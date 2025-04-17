import { FocusEvent } from 'react';
import {
  ariaDescribedByIds,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  rangeSpec,
} from '@rjsf/utils';
import { Label, Slider, SliderOnChangeData } from '@fluentui/react-components';

/** The `RangeWidget` component uses the `BaseInputTemplate` changing the type to `range` and wrapping the result
 * in a div, with the value along side it.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RangeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const { value, readonly, disabled, onBlur, onFocus, options, schema, onChange, required, label, hideLabel, id } =
    props;
  const sliderProps = { value, label, id, name: id, ...rangeSpec<S>(schema) };

  const _onChange = (_: any, data: SliderOnChangeData) => {
    onChange(data.value ?? options.emptyValue);
  };
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target && target.value);
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target && target.value);

  return (
    <>
      {labelValue(
        <Label required={required} htmlFor={id}>
          {label || undefined}
        </Label>,
        hideLabel,
      )}
      <Slider
        disabled={disabled || readonly}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        {...sliderProps}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
    </>
  );
}
