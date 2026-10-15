import type { FocusEvent } from 'react';
import type { SliderProps } from '@fluentui/react-components';
import { Label, Slider } from '@fluentui/react-components';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes, labelValue, rangeSpec, widgetDrawsLabel } from '@rjsf/utils';

/** The `RangeWidget` component uses the `BaseInputTemplate` changing the type to `range` and wrapping the result
 * in a div, with the value along side it.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function RangeWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    value,
    readonly,
    disabled,
    autofocus,
    onBlur,
    onFocus,
    schema,
    onChange,
    required,
    label,
    id,
    htmlName,
    presentation,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const sliderProps = {
    value,
    label,
    id,
    name: htmlName || id,
    required,
    autoFocus: autofocus,
    ...rangeSpec<S>(schema),
  };

  const handleChange: NonNullable<SliderProps['onChange']> = (_, data) => onChange(data.value);
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.value);

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
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        {...sliderProps}
        {...getControlAttributes<T, S, F>({ id, presentation })}
      />
    </>
  );
}
