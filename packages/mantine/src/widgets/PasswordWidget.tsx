import React, { useCallback } from 'react';
import {
  ariaDescribedByIds,
  FormContextType,
  labelValue,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
} from '@rjsf/utils';
import { PasswordInput } from '@mantine/core';
import { cleanupOptions } from '../utils';

/**
 * The `PasswordWidget` component renders a password input element.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function PasswordWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>) {
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

  const emptyValue = options.emptyValue || '';
  const themeProps = cleanupOptions(options);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value === '' ? emptyValue : e.target.value);
    },
    [onChange, emptyValue]
  );

  const handleBlur = useCallback(
    ({ target }: React.FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, target && target.value);
      }
    },
    [onBlur, id]
  );

  const handleFocus = useCallback(
    ({ target }: React.FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, target && target.value);
      }
    },
    [onFocus, id]
  );

  return (
    <PasswordInput
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
      aria-describedby={ariaDescribedByIds<T>(id)}
    />
  );
}
