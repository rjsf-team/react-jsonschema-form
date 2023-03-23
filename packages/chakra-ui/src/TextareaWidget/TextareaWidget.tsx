import { ChangeEvent, FocusEvent } from 'react';
import { FormControl, FormLabel, Textarea } from '@chakra-ui/react';
import {
  ariaDescribedByIds,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { getChakra } from '../utils';

export default function TextareaWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>({
  id,
  placeholder,
  value,
  label,
  hideLabel,
  disabled,
  autofocus,
  readonly,
  onBlur,
  onFocus,
  onChange,
  options,
  uiSchema,
  required,
  rawErrors,
}: WidgetProps<T, S, F>) {
  const chakraProps = getChakra({ uiSchema });

  const _onChange = ({ target: { value } }: ChangeEvent<HTMLTextAreaElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLTextAreaElement>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLTextAreaElement>) => onFocus(id, value);

  return (
    <FormControl
      mb={1}
      {...chakraProps}
      isDisabled={disabled || readonly}
      isRequired={required}
      isReadOnly={readonly}
      isInvalid={rawErrors && rawErrors.length > 0}
    >
      {labelValue(<FormLabel htmlFor={id}>{label}</FormLabel>, hideLabel || !label)}
      <Textarea
        id={id}
        name={id}
        value={value ?? ''}
        placeholder={placeholder}
        autoFocus={autofocus}
        onChange={_onChange}
        onBlur={_onBlur}
        onFocus={_onFocus}
        aria-describedby={ariaDescribedByIds<T>(id)}
      />
    </FormControl>
  );
}
