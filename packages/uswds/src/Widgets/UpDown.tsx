import { ChangeEvent, FocusEvent } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { TextInput } from '@trussworks/react-uswds';

export default function UpDown<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  id,
  required,
  readonly,
  disabled,
  value,
  onChange,
  onBlur,
  onFocus,
  options,
}: WidgetProps<T, S, F>) {
  const _onChange = ({ target: { value: v } }: ChangeEvent<HTMLInputElement>) => onChange(v);
  const _onBlur = ({ target: { value: v } }: FocusEvent<HTMLInputElement>) => onBlur(id, v);
  const _onFocus = ({ target: { value: v } }: FocusEvent<HTMLInputElement>) => onFocus(id, v);

  return (
    <TextInput
      type="number"
      id={id}
      name={id}
      required={required}
      disabled={disabled || readonly}
      value={value || ''}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      min={Number(options.min)}
      max={Number(options.max)}
      step={Number(options.step)}
    />
  );
}
