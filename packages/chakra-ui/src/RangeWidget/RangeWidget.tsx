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
  const _onChange = ({ value }: SliderValueChangeDetails) =>
    onChange(value === undefined ? options.emptyValue : value[0]);
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target && target.value);
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target && target.value);

  return (
    <Field mb={1} label={labelValue(label, hideLabel || !label)}>
      <Slider
        {...rangeSpec<S>(schema)}
        id={id}
        name={id}
        disabled={disabled || readonly}
        value={[value]}
        onValueChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
    </Field>
  );
}
