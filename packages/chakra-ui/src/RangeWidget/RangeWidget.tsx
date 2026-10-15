import type { FocusEvent } from 'react';
import type { SliderValueChangeDetails } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes, labelValue, rangeSpec, widgetDrawsLabel } from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { Slider } from '../components/ui/slider.tsx';
import { getChakra } from '../utils.ts';

export default function RangeWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { value, readonly, disabled, onBlur, onFocus, options, schema, onChange, label, id, presentation } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const handleChange = ({ value: newValue }: SliderValueChangeDetails) =>
    onChange(newValue === undefined ? options.emptyValue : newValue[0]);
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.value);

  const chakraProps = getChakra(options);

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
        thumbProps={getControlAttributes<T, S, F>({ id, presentation })}
      />
    </Field>
  );
}
