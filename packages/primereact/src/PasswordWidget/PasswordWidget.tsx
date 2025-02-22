import {
  ariaDescribedByIds,
  FormContextType,
  getInputProps,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { ChangeEvent } from 'react';
import { Password } from 'primereact/password';

export default function PasswordWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    placeholder,
    value,
    required,
    readonly,
    disabled,
    onChange,
    onChangeOverride,
    onBlur,
    onFocus,
    autofocus,
    options,
    schema,
    type,
    rawErrors = [],
  } = props;
  const inputProps = getInputProps<T, S, F>(schema, type, options);
  const { feedback, promptLabel, weakLabel, mediumLabel, strongLabel, toggleMask } = options;

  const _onChange = ({ target: { value } }: ChangeEvent<HTMLInputElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);

  return (
    <Password
      id={id}
      name={id}
      placeholder={placeholder}
      {...inputProps}
      required={required}
      autoFocus={autofocus}
      disabled={disabled || readonly}
      value={value || ''}
      invalid={rawErrors.length > 0}
      feedback={!!feedback}
      promptLabel={promptLabel as string}
      weakLabel={weakLabel as string}
      mediumLabel={mediumLabel as string}
      strongLabel={strongLabel as string}
      toggleMask={!!toggleMask}
      onChange={onChangeOverride || _onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      aria-describedby={ariaDescribedByIds<T>(id, !!schema.examples)}
      pt={{ root: { style: { display: 'flex', flexDirection: 'column' } } }}
    />
  );
}
