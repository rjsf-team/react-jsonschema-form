import { ChangeEvent } from 'react';
import {
  ariaDescribedByIds,
  labelValue,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { Textarea } from '@mantine/core';

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TextareaWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    placeholder,
    value,
    required,
    disabled,
    autofocus,
    label,
    hideLabel,
    readonly,
    onBlur,
    onFocus,
    onChange,
    options,
    rawErrors = [],
  } = props;

  const _onChange = ({ target: { value } }: ChangeEvent<HTMLTextAreaElement>) =>
    onChange && onChange(value === '' ? options.emptyValue : value);
  const _onBlur = () => onBlur && onBlur(id, value);
  const _onFocus = () => onFocus && onFocus(id, value);
  return (
    <Textarea
      id={id}
      key={id}
      name={id}
      label={labelValue(label || undefined, hideLabel, false)}
      placeholder={placeholder}
      autoFocus={autofocus}
      required={required}
      disabled={disabled || readonly}
      value={value || ''}
      error={rawErrors.length > 0}
      rows={options.rows || 5}
      onChange={_onChange}
      onBlur={_onBlur}
      onFocus={_onFocus}
      aria-describedby={ariaDescribedByIds<T>(id)}
    />
  );
}
