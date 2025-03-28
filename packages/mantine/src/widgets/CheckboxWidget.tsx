import React, { useCallback } from 'react';
import {
  StrictRJSFSchema,
  RJSFSchema,
  FormContextType,
  WidgetProps,
  labelValue,
  ariaDescribedByIds,
} from '@rjsf/utils';
import { Checkbox } from '@mantine/core';

export default function CheckboxWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any
>(props: WidgetProps<T, S, F>): React.ReactElement {
  const {
    id,
    name,
    value = false,
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

  const handleCheckboxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!disabled && !readonly && onChange) {
        onChange(e.currentTarget.checked);
      }
    },
    [onChange, disabled, readonly]
  );

  const handleBlur = useCallback(
    ({ target }: React.FocusEvent<HTMLInputElement>) => {
      if (onBlur) {
        onBlur(id, target.checked);
      }
    },
    [onBlur, id]
  );

  const handleFocus = useCallback(
    ({ target }: React.FocusEvent<HTMLInputElement>) => {
      if (onFocus) {
        onFocus(id, target.checked);
      }
    },
    [onFocus, id]
  );

  return (
    <Checkbox
      id={id}
      name={name}
      label={labelValue(label || undefined, hideLabel, false)}
      disabled={disabled || readonly}
      required={required}
      autoFocus={autofocus}
      checked={typeof value === 'undefined' ? false : value === 'true' || value}
      onChange={handleCheckboxChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      error={rawErrors && rawErrors.length > 0 ? rawErrors.join('\n') : undefined}
      aria-describedby={ariaDescribedByIds<T>(id)}
      {...options}
      classNames={typeof options?.classNames === 'object' ? options.classNames : undefined}
    />
  );
}
