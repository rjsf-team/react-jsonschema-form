import { Slider, Label } from '@fluentui/react';
import {
  ariaDescribedByIds,
  FormContextType,
  rangeSpec,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import _pick from 'lodash/pick';

const styles_red = {
  // TODO: get this color from theme.
  color: 'rgb(164, 38, 44)',
  fontSize: 12,
  fontWeight: 'normal' as any,
  fontFamily: `"Segoe UI", "Segoe UI Web (West European)", "Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;`,
};

// Keys of ISliderProps from @fluentui/react
const allowedProps = [
  'componentRef',
  'styles?',
  'theme',
  'label',
  'defaultValue',
  'value',
  'min',
  'max',
  'step',
  'showValue',
  'onChange',
  'ariaLabel',
  'ariaValueText',
  'vertical',
  'disabled',
  'snapToStep',
  'className',
  'buttonProps',
  'valueFormat',
  'originFromZero',
];

export default function RangeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  value,
  readonly,
  disabled,
  options,
  schema,
  onChange,
  required,
  label,
  id,
}: WidgetProps<T, S, F>) {
  const sliderProps = { value, label, id, ...rangeSpec<S>(schema) };

  const _onChange = (value: number) => onChange(value);

  const uiProps = _pick((options.props as object) || {}, allowedProps);
  return (
    <>
      <Label>
        {label || schema.title}
        {required && <span style={styles_red}>&nbsp;*</span>}
      </Label>
      <Slider
        disabled={disabled || readonly}
        min={sliderProps.min}
        max={sliderProps.max}
        step={sliderProps.step}
        onChange={_onChange}
        snapToStep
        {...uiProps}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
    </>
  );
}
