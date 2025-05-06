import { ChangeEvent, FocusEvent } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

// USWDS doesn't have a specific color picker, use styled native input
export default function ColorWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ id, value, disabled, readonly, onChange, onBlur, onFocus, required }: WidgetProps<T, S, F>) {
  function _onChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value);
  }
  function _onBlur(event: FocusEvent<HTMLInputElement>) {
    onBlur(id, event.target.value);
  }
  function _onFocus(event: FocusEvent<HTMLInputElement>) {
    onFocus(id, event.target.value);
  }

  return (
    <input
      type="color"
      id={id}
      name={id}
      className="usa-input" // Apply basic styling, might need width adjustment
      style={{ height: '2.5rem', padding: '0.25rem' }} // Basic height/padding
      value={value || ''}
      required={required}
      disabled={disabled || readonly}
      onChange={!readonly ? _onChange : undefined}
      onBlur={!readonly ? _onBlur : undefined}
      onFocus={!readonly ? _onFocus : undefined}
    />
  );
}
