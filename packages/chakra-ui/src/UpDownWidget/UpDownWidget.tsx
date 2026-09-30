import type { FocusEvent } from 'react';
import type { NumberInputValueChangeDetails } from '@chakra-ui/react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, hasVisibleErrors, labelValue } from '@rjsf/utils';

import { Field } from '../components/ui/field.tsx';
import { NumberInputRoot } from '../components/ui/number-input.tsx';
import { getChakra } from '../utils.ts';

export default function UpDownWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, readonly, disabled, label, hideLabel, value, onChange, onBlur, onFocus, required } = props;

  const handleChange = ({ value: newValue }: NumberInputValueChangeDetails) => onChange(newValue);
  // The handlers sit on the root, so the target may be an increment/decrement trigger rather than the input. Duck-typed
  // on `valueAsNumber`, which only inputs have, rather than `instanceof HTMLInputElement`, which is false inside an iframe.
  const inputValue = (target: HTMLElement) =>
    'valueAsNumber' in target && 'value' in target ? target.value : undefined;
  const handleBlur = ({ target }: FocusEvent<HTMLElement>) => onBlur(id, inputValue(target));
  const handleFocus = ({ target }: FocusEvent<HTMLElement>) => onFocus(id, inputValue(target));

  const chakraProps = getChakra({ uiSchema: props.uiSchema });

  return (
    <Field
      mb={1}
      disabled={disabled || readonly}
      required={required}
      readOnly={readonly}
      invalid={hasVisibleErrors(props)}
      label={labelValue(label, hideLabel || !label)}
      {...chakraProps}
    >
      <NumberInputRoot
        value={value}
        onValueChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        aria-describedby={ariaDescribedByIds(id)}
        id={id}
        name={id}
      />
    </Field>
  );
}
