import type { FocusEvent } from 'react';
import { useEffect, useRef } from 'react';
import type { SliderValueChangeDetails } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { fieldLabelId, getControlAttributes, labelValue, rangeSpec, widgetDrawsLabel } from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { Slider } from '../components/ui/slider.tsx';
import { getChakra } from '../utils.ts';

export default function RangeWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { value, readonly, disabled, autofocus, onBlur, onFocus, options, schema, onChange, label, id, presentation } =
    props;
  const thumbRef = useRef<HTMLDivElement>(null);
  // React focuses a form control marked `autoFocus` as it mounts, but not the thumb, which is a <div>
  useEffect(() => {
    if (autofocus) {
      thumbRef.current?.focus();
    }
  }, [autofocus]);
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const handleChange = ({ value: newValue }: SliderValueChangeDetails) =>
    onChange(newValue === undefined ? options.emptyValue : newValue[0]);
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.value);

  const chakraProps = getChakra(options);
  const labelId = fieldLabelId(id);
  const drawsLabel = !hideLabel && !!label;

  return (
    <Field mb={1} label={labelValue(label, !drawsLabel)} ids={{ label: labelId }} labelNamesNoControl {...chakraProps}>
      <Slider
        {...rangeSpec<S>(schema)}
        id={id}
        // The thumb, which a user focuses, carries the field's id, and is named by the label through
        // `aria-labelledby`, since a `for` can't name it. With no label drawn, an empty one stops Ark pointing it at the
        // missing label, as Ark ignores an undefined override
        ids={{ thumb: () => id, label: labelId }}
        name={id}
        disabled={disabled || readonly}
        value={[value]}
        onValueChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        thumbProps={{
          ref: thumbRef,
          ...(!drawsLabel && { 'aria-labelledby': '' }),
          ...getControlAttributes<T, S, F>({ id, presentation }),
        }}
      />
    </Field>
  );
}
