import { Slider } from '@fluentui/react';
import {
  ariaDescribedByIds,
  labelValue,
  FormContextType,
  rangeSpec,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import _pick from 'lodash/pick';

import FluentLabel from '../FluentLabel/FluentLabel';

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

export default function RangeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  value,
  readonly,
  disabled,
  options,
  schema,
  onChange,
  required,
  label,
  hideLabel,
  id,
}: WidgetProps<T, S, F>) {
  const sliderProps = { value, label, id, ...rangeSpec<S>(schema) };

  const _onChange = (value: number) => onChange(value);

  const uiProps = { id, ..._pick((options.props as object) || {}, allowedProps) };
  return (
    <>
      {labelValue(<FluentLabel label={label || undefined} required={required} id={id} />, hideLabel)}
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
