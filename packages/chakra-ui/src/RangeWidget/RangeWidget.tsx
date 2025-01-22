import { FocusEvent } from 'react';
import { SliderValueChangeDetails } from '@chakra-ui/react';
import {
  ariaDescribedByIds,
  FormContextType,
  labelValue,
  rangeSpec,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { Field } from '../components/ui/field';
import { Slider } from '../components/ui/slider';

export default function RangeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  value,
  readonly,
  disabled,
  onBlur,
  onFocus,
  options,
  schema,
  onChange,
  label,
  hideLabel,
  id,
}: WidgetProps<T, S, F>) {
  // const chakraProps = getChakra({ uiSchema });

  const sliderWidgetProps = { value, label, id, ...rangeSpec<S>(schema) };

  const _onChange = ({ value }: SliderValueChangeDetails) => onChange(value === undefined ? options.emptyValue : value);
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target && target.value);
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target && target.value);

  return (
    <Field mb={1} label={labelValue(label, hideLabel || !label)}>
      <Slider
        {...sliderWidgetProps}
        id={id}
        name={id}
        disabled={disabled || readonly}
        onValueChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
    </Field>
  );
}
