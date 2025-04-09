import React, { useCallback } from 'react';
import { StrictRJSFSchema, RJSFSchema, FormContextType, WidgetProps, labelValue } from '@rjsf/utils';
import { Textarea } from '@mantine/core';
import { cleanupOptions } from '../utils';

export default function TextareaWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>): React.ReactElement {
  const {
    id,
    name,
    value,
    placeholder,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    hideLabel,
    rawErrors,
    options,
    onChange,
    onBlur,
    onFocus,
  } = props;

  const themeProps = cleanupOptions(options);
  const emptyValue = options?.emptyValue ?? '';

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value === '' ? emptyValue : e.target.value);
    },
    [onChange, emptyValue]
  );

  const handleBlur = useCallback(
    ({ target }: React.FocusEvent<HTMLTextAreaElement>) => {
      if (onBlur) {
        onBlur(id, target && target.value);
      }
    },
    [onBlur, id]
  );

  const handleFocus = useCallback(
    ({ target }: React.FocusEvent<HTMLTextAreaElement>) => {
      if (onFocus) {
        onFocus(id, target && target.value);
      }
    },
    [onFocus, id]
  );

  return (
    <Textarea
      id={id}
      name={name}
      value={value || ''}
      placeholder={placeholder || undefined}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      label={labelValue(label || undefined, hideLabel, false)}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      error={rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined}
      {...themeProps}
    />
  );
}
