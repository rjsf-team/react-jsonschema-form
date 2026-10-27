import type { FocusEvent } from 'react';
import type { SliderProps } from '@fluentui/react-components';
import { Label, makeStyles, Slider } from '@fluentui/react-components';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes, labelValue, rangeSpec, widgetDrawsLabelText } from '@rjsf/utils';

const useStyles = makeStyles({
  // Fluent's `Slider` keeps a 120px minimum width, which would push it out of a narrower layout grid column
  slider: { minWidth: 0 },
});

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
  const classes = useStyles();
  // A label holding only a required field's `*` would name the slider "star", so one is drawn only with text
  const hideLabel = !widgetDrawsLabelText<T, S, F>(props);
  const sliderProps = {
    value: typeof value === 'number' ? value : undefined,
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
          {label}
        </Label>,
        hideLabel,
      )}
      <Slider
        className={classes.slider}
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
