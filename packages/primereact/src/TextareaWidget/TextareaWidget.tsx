import React from 'react';
import { InputTextarea } from 'primereact/inputtextarea';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

/** The `TextareaWidget` is a widget for rendering input fields as textarea using PrimeReact.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TextareaWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const { id, value, required, disabled, readonly, autofocus, onChange, onBlur, onFocus, options } = props;

  let rows = 5;
  // noinspection SuspiciousTypeOfGuard
  if (typeof options.rows === 'string' || typeof options.rows === 'number') {
    rows = Number(options.rows);
  }

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value === '' ? options.emptyValue : event.target.value);
  };

  return (
    <InputTextarea
      id={id}
      value={value || ''}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      rows={rows}
      onChange={handleChange}
      onBlur={onBlur && ((event) => onBlur(id, event.target.value))}
      onFocus={onFocus && ((event) => onFocus(id, event.target.value))}
    />
  );
}
