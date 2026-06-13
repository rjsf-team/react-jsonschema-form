import type { FocusEvent } from 'react';
import type { SliderValueChangeDetails } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, labelValue, rangeSpec } from '@rjsf/utils';

import { Field } from '../components/ui/field';
import { Slider } from '../components/ui/slider';
import { getChakra } from '../utils';

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
  uiSchema,
}: WidgetProps<T, S, F>) {
  const handleChange = ({ value: newValue }: SliderValueChangeDetails) =>
    onChange(newValue === undefined ? options.emptyValue : newValue[0]);
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.value);

  const chakraProps = getChakra({ uiSchema });

  return (
    <Field mb={1} label={labelValue(label, hideLabel || !label)} {...chakraProps}>
      <Slider
        {...rangeSpec<S>(schema)}
        id={id}
        name={id}
        disabled={disabled || readonly}
        value={[value]}
        onValueChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        aria-describedby={ariaDescribedByIds(id)}
      />
    </Field>
  );
}
