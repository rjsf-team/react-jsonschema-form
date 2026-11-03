import type { FocusEvent } from 'react';
import { useEffect, useRef } from 'react';
import type { SliderValueChangeDetails } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  getControlAttributes,
  getLabelId,
  hasWidgetErrors,
  labelValue,
  numericWidgetStoresString,
  rangeSpec,
  toNumericValue,
  widgetDrawsLabelText,
} from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { Slider } from '../components/ui/slider.tsx';
import { getChakra, labelledByOrNone } from '../utils.ts';

export default function RangeWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    value,
    readonly,
    disabled,
    required,
    autofocus,
    onBlur,
    onFocus,
    options,
    schema,
    onChange,
    label,
    id,
    htmlName,
    presentation,
  } = props;
  const thumbRef = useRef<HTMLDivElement>(null);
  const focusOnMount = useRef(autofocus);
  // React focuses a form control marked `autoFocus` as it mounts, but not the thumb, which is a <div>. Like
  // `autoFocus`, this acts only on mount, so an `autofocus` that turns true later doesn't take focus from the user
  useEffect(() => {
    if (focusOnMount.current) {
      // Cleared, since React runs the effect again each time an `<Activity>` around the form is shown
      focusOnMount.current = false;
      thumbRef.current?.focus();
    }
  }, []);
  // Set by a change Zag reports during an interaction, so its end doesn't overwrite that change with the minimum while
  // the value it rendered with is still empty, as it is when the change is committed later
  const changedRef = useRef(false);
  const storesString = numericWidgetStoresString<S>(schema, value);
  const write = (nextValue: number) => onChange(storesString ? String(nextValue) : nextValue);
  const handleChange = ({ value: newValue }: SliderValueChangeDetails) => {
    changedRef.current = true;
    if (newValue === undefined) {
      onChange(options.emptyValue);
    } else {
      write(newValue[0]);
    }
  };
  const numericValue = toNumericValue(value);
  // Zag reports only a value that changes, so a press or a key that leaves an empty range's thumb at its minimum commits
  // the minimum itself, as moving a native range's thumb there would
  const handleChangeEnd = ({ value: newValue }: SliderValueChangeDetails) => {
    if (!changedRef.current && numericValue === undefined) {
      write(newValue[0]);
    }
    changedRef.current = false;
  };
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.value);

  const spec = rangeSpec<S>(schema);
  const chakraProps = getChakra(options);
  const drawsLabel = widgetDrawsLabelText<T, S, F>(props);
  const labelId = getLabelId<T, S, F>(props);
  const controlAttributes = getControlAttributes<T, S, F>({ id, presentation });

  return (
    <Field
      mb={1}
      disabled={disabled || readonly}
      required={required}
      readOnly={readonly}
      invalid={hasWidgetErrors<T, S, F>(props)}
      label={labelValue(label, !drawsLabel)}
      ids={{ label: labelId }}
      labelNamesNoControl
      // The label has no `for`, which can't name the thumb, so a click on it focuses the thumb, as zag's own slider
      // label does
      onLabelClick={() => thumbRef.current?.focus()}
      {...chakraProps}
    >
      <Slider
        {...spec}
        id={id}
        // The thumb, which a user focuses, carries the field's id, and is named by the label through
        // `aria-labelledby`, since a `for` can't name it
        ids={{ thumb: () => id, label: labelId }}
        // An empty range draws its thumb at its minimum, which isn't a value it holds, so it submits nothing
        name={numericValue === undefined ? undefined : htmlName || id}
        disabled={disabled || readonly}
        value={[numericValue ?? spec.min ?? 0]}
        onValueChange={handleChange}
        onValueChangeEnd={handleChangeEnd}
        onBlur={handleBlur}
        onFocus={handleFocus}
        thumbProps={{
          ref: thumbRef,
          ...controlAttributes,
          'aria-labelledby': labelledByOrNone(controlAttributes['aria-labelledby'], drawsLabel),
        }}
      />
    </Field>
  );
}
