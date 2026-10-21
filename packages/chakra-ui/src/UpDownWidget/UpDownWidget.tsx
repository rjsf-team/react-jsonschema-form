import type { FocusEvent } from 'react';
import type { NumberInputValueChangeDetails } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes, hasWidgetErrors, labelValue, widgetDrawsLabelText } from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { NumberInputRoot } from '../components/ui/number-input.tsx';
import { getChakra, isInputElement } from '../utils.ts';

export default function UpDownWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    readonly,
    disabled,
    autofocus,
    label,
    value,
    onChange,
    onBlur,
    onFocus,
    required,
    presentation,
  } = props;
  const drawsLabel = widgetDrawsLabelText<T, S, F>(props);

  const handleChange = ({ value: newValue }: NumberInputValueChangeDetails) => onChange(newValue);
  // The handlers sit on the root, so the target may be an increment/decrement trigger rather than the input
  const inputValue = (target: HTMLElement) => (isInputElement(target) ? target.value : undefined);
  const handleBlur = ({ target }: FocusEvent<HTMLElement>) => onBlur(id, inputValue(target));
  const handleFocus = ({ target }: FocusEvent<HTMLElement>) => onFocus(id, inputValue(target));

  const chakraProps = getChakra(props.options);

  return (
    <Field
      mb={1}
      disabled={disabled || readonly}
      required={required}
      readOnly={readonly}
      invalid={hasWidgetErrors<T, S, F>(props)}
      label={labelValue(label, !drawsLabel)}
      id={id}
      {...chakraProps}
    >
      <NumberInputRoot
        // Zag's number input is uncontrolled while `value` is `undefined`, and would go on showing the last number
        // after the form clears the value, so a missing value is passed as the empty input it is. Its value is the
        // input's text, which it compares by identity with the text it formats on blur and Enter, so a stored number
        // is passed as its text too, or that comparison would report a change nobody made. The widget hands Zag no
        // `min` or `max`, so its blur would clamp a number past the safe integers to them, and only on blur, not Enter;
        // the schema's own bounds are the form's to validate, so that clamp is turned off
        value={value == null ? '' : String(value)}
        clampValueOnBlur={false}
        onValueChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        inputProps={{ ...getControlAttributes<T, S, F>({ id, presentation }), autoFocus: autofocus }}
        id={id}
        name={htmlName || id}
      />
    </Field>
  );
}
