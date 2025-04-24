import { FocusEvent } from 'react';

import {
  ariaDescribedByIds,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { NumberInputValueChangeDetails } from '@chakra-ui/react';

import { Field } from '../components/ui/field';
import { NumberInputRoot } from '../components/ui/number-input';

export default function UpDownWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const { id, readonly, disabled, label, hideLabel, value, onChange, onBlur, onFocus, rawErrors, required } = props;

  const _onChange = ({ value }: NumberInputValueChangeDetails) => onChange(value);
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement | any>) => onBlur(id, target && target.value);
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement | any>) => onFocus(id, target && target.value);

  return (
    <Field
      mb={1}
      disabled={disabled || readonly}
      required={required}
      readOnly={readonly}
      invalid={rawErrors && rawErrors.length > 0}
      label={labelValue(label, hideLabel || !label)}
    >
      <NumberInputRoot
        value={value}
        onValueChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
        id={id}
        name={id}
      />
    </Field>
  );
}
