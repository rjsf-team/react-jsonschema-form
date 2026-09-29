import type { ChangeEvent, FocusEvent } from 'react';
import { useCallback } from 'react';
import { PasswordInput } from '@mantine/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { labelValue } from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps, useAriaDescribedByProps, visibleErrors } from '../utils.tsx';

/**
 * The `PasswordWidget` component renders a password input element.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function PasswordWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const {
    id,
    htmlName,
    value,
    placeholder,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    hideLabel,
    options,
    onChange,
    onBlur,
    onFocus,
  } = props;

  const { emptyValue } = options;
  const themeProps = cleanupOptions(options);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value === '' ? emptyValue : e.target.value);
    },
    [onChange, emptyValue],
  );

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, target?.value);
      }
    },
    [onBlur, id],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, target?.value);
      }
    },
    [onFocus, id],
  );

  const ariaDescribedByProps = useAriaDescribedByProps('PasswordInput', id, options);

  const error = visibleErrors(props);
  return (
    <PasswordInput
      id={id}
      name={htmlName || id}
      value={value || ''}
      placeholder={placeholder || undefined}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      label={labelValue(label || undefined, hideLabel, false)}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      error={error}
      // Mantine's `PasswordInput` renders its input without the `aria-invalid` the other inputs get from `Input`
      aria-invalid={!!error || undefined}
      {...themeProps}
      {...ariaDescribedByProps}
      {...getDescriptionProps(props)}
    />
  );
}
