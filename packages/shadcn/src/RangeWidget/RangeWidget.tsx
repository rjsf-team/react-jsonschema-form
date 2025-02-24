import { ariaDescribedByIds, FormContextType, rangeSpec, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { Slider } from '../components/ui/slider';
const allowedProps = [
  'name',
  'min',
  'max',
  'step',
  'orientation',
  'disabled',
  'defaultValue',
  'value',
  'onValueChange',
  'className',
  'dir',
  'inverted',
  'minStepsBetweenThumbs',
];
import _pick from 'lodash/pick';

export default function RangeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  value,
  readonly,
  disabled,
  options,
  schema,
  onChange,
  label,
  id,
}: WidgetProps<T, S, F>) {
  const _onChange = (value: number[]) => onChange(value[0]);

  const sliderProps = { value, label, id, ...rangeSpec<S>(schema) };
  const uiProps = { id, ..._pick((options.props as object) || {}, allowedProps) };
  return (
    <>
      <Slider
        disabled={disabled || readonly}
        min={sliderProps.min}
        max={sliderProps.max}
        step={sliderProps.step}
        value={[value as number]}
        onValueChange={_onChange}
        {...uiProps}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
      {value}
    </>
  );
}
