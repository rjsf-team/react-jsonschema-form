import type { FocusEvent } from 'react';
import type { NumberInputValueChangeDetails } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getControlAttributes, hasWidgetErrors, labelValue, widgetDrawsLabel } from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { NumberInputRoot } from '../components/ui/number-input.tsx';
import { getChakra, isInputElement } from '../utils.ts';

export default function UpDownWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, htmlName, readonly, disabled, label, value, onChange, onBlur, onFocus, required, presentation } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);

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
      label={labelValue(label, hideLabel || !label)}
      id={id}
      {...chakraProps}
    >
      <NumberInputRoot
        value={value}
        onValueChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        inputProps={getControlAttributes<T, S, F>({ id, presentation })}
        id={id}
        name={htmlName || id}
      />
    </Field>
  );
}
