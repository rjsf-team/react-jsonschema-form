import React, { useCallback } from 'react';
import {
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  labelValue,
  ariaDescribedByIds,
} from '@rjsf/utils';
import { ColorInput } from '@mantine/core';

/** The `ColorWidget` component uses the `ColorInput` from Mantine, allowing users to pick a color.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function ColorWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) {
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

  const handleChange = useCallback(
    (nextValue: string) => {
      onChange(nextValue);
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
    <ColorInput
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
      {...options}
      aria-describedby={ariaDescribedByIds<T>(id)}
      popoverProps={{ withinPortal: false }}
      classNames={typeof options?.classNames === 'object' ? options.classNames : undefined}
    />
  );
}
