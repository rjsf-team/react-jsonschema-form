import type { FocusEvent } from 'react';
import { useCallback } from 'react';
import { ColorInput } from '@mantine/core';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { labelValue } from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps, useAriaDescribedByProps, visibleErrorText } from '../utils.tsx';

/** The `ColorWidget` component uses the `ColorInput` from Mantine, allowing users to pick a color.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function ColorWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
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
    options,
    onChange,
    onBlur,
    onFocus,
  } = props;

  const themeProps = cleanupOptions(options);

  const handleChange = useCallback(
    (nextValue: string) => {
      onChange(nextValue);
    },
    [onChange],
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

  const ariaDescribedByProps = useAriaDescribedByProps('ColorInput', id, options);

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
      error={visibleErrorText(props)}
      {...themeProps}
      popoverProps={{ withinPortal: false }}
      {...ariaDescribedByProps}
      {...getDescriptionProps(props)}
    />
  );
}
