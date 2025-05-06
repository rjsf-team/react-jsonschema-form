import { ChangeEvent, FocusEvent } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { Textarea } from '@trussworks/react-uswds';

export default function TextArea<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  id,
  value,
  required,
  disabled,
  readonly,
  autofocus,
  onChange,
  onBlur,
  onFocus,
  options,
}: WidgetProps<T, S, F>) {
  const _onChange = ({ target: { value: v } }: ChangeEvent<HTMLTextAreaElement>) => onChange(v);
  const _onBlur = ({ target: { value: v } }: FocusEvent<HTMLTextAreaElement>) => onBlur(id, v);
  const _onFocus = ({ target: { value: v } }: FocusEvent<HTMLTextAreaElement>) => onFocus(id, v);

  return (
    <Textarea
      id={id}
      name={id}
      value={value || ''}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      rows={options.rows || 5}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
    />
  );
}
