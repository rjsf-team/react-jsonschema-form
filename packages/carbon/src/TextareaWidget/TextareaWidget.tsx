import { ChangeEvent, FocusEvent } from 'react';
import { ariaDescribedByIds, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { TextArea } from '@carbon/react';
import { LabelValue } from '../components/LabelValue';

/** Implement `TextareaWidget`
 */
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
  required,
  rawErrors,
}: WidgetProps<T, S, F>) {
  const _onChange = ({ target: { value } }: ChangeEvent<HTMLTextAreaElement>) =>
    onChange(value === '' ? options.emptyValue : value);
  const _onBlur = ({ target: { value } }: FocusEvent<HTMLTextAreaElement>) => onBlur(id, value);
  const _onFocus = ({ target: { value } }: FocusEvent<HTMLTextAreaElement>) => onFocus(id, value);

  return (
    <TextArea
      className='form-control'
      hideLabel
      labelText={<LabelValue label={label} required={required} hide={hideLabel || !label} />}
      disabled={disabled || readonly}
      id={id}
      name={id}
      value={value ?? ''}
      placeholder={placeholder}
      autoFocus={autofocus}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      aria-describedby={ariaDescribedByIds<T>(id)}
      invalid={rawErrors && rawErrors.length > 0}
    />
  );
}
