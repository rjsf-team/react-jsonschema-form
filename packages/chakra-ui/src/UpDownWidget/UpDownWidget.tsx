import { FocusEvent } from 'react';

import {
  ariaDescribedByIds,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { getChakra } from '../utils';
import { Field } from '../components/ui/field';
import { NumberInputField, NumberInputRoot } from '../components/ui/number-input';

export default function UpDownWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const { id, uiSchema, readonly, disabled, label, hideLabel, value, onChange, onBlur, onFocus, rawErrors, required } =
    props;

  const chakraProps = getChakra({ uiSchema });

  const _onChange = (value: string | number) => onChange(value);
  const _onBlur = ({ target }: FocusEvent<HTMLInputElement | any>) => onBlur(id, target && target.value);
  const _onFocus = ({ target }: FocusEvent<HTMLInputElement | any>) => onFocus(id, target && target.value);

  return (
    <Field
      mb={1}
      {...chakraProps}
      disabled={disabled || readonly}
      required={required}
      isReadOnly={readonly}
      invalid={rawErrors && rawErrors.length > 0}
      label={labelValue(label, hideLabel || !label)}
    >
      <NumberInputRoot
        value={value ?? ''}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
        id={id}
        name={id}
      >
        <NumberInputField />
      </NumberInputRoot>
    </Field>
  );
}
