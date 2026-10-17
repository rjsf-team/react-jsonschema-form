import type { FocusEvent } from 'react';
import { useEffect, useRef } from 'react';
import type { SliderValueChangeDetails } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  getControlAttributes,
  getLabelId,
  hasWidgetErrors,
  labelValue,
  rangeSpec,
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
  const handleChange = ({ value: newValue }: SliderValueChangeDetails) =>
    onChange(newValue === undefined ? options.emptyValue : newValue[0]);
  const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => onBlur(id, target?.value);
  const handleFocus = ({ target }: FocusEvent<HTMLInputElement>) => onFocus(id, target?.value);

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
        {...rangeSpec<S>(schema)}
        id={id}
        // The thumb, which a user focuses, carries the field's id, and is named by the label through
        // `aria-labelledby`, since a `for` can't name it
        ids={{ thumb: () => id, label: labelId }}
        name={htmlName || id}
        disabled={disabled || readonly}
        value={[value]}
        onValueChange={handleChange}
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
