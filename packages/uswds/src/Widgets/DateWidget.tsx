import { FocusEvent } from 'react';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { DatePicker } from '@trussworks/react-uswds';

export default function DateWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({ id, value, disabled, readonly, onChange, onBlur, onFocus }: WidgetProps<T, S, F>) {
  function _onChange(val?: string) {
    onChange(val || undefined);
  }

  function _onBlur(event: FocusEvent<HTMLInputElement | HTMLDivElement>) {
    const target = event.target as HTMLInputElement;
    onBlur(id, target.value);
  }
  function _onFocus(event: FocusEvent<HTMLInputElement>) {
    onFocus(id, event.target.value);
  }

  return (
    <DatePicker
      id={id}
      name={id}
      defaultValue={value}
      disabled={disabled || readonly}
      onChange={!readonly ? _onChange : undefined}
      onBlur={!readonly ? _onBlur : undefined}
      onInput={!readonly ? _onFocus : undefined} // DatePicker uses onInput for focus-like events
    />
  );
}
