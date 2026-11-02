import type { FocusEvent } from 'react';
import { useCallback } from 'react';
import { ColorInput } from '@mantine/core';
import type { DateElementFormat, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { labelValue, toInputValue, widgetDrawsLabel } from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps, getWidgetError, useInputAriaProps } from '../utils.tsx';

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
    htmlName,
    value,
    placeholder,
    required,
    disabled,
    readonly,
    autofocus,
    label,
    options,
    onChange,
    onBlur,
    onFocus,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);

  const themeProps = cleanupOptions(options, props);

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

  const ariaDescribedByProps = useInputAriaProps('ColorInput', props);
  const error = getWidgetError<T, S, F>(props);

  return (
    <ColorInput
      id={id}
      name={htmlName || id}
      value={String(toInputValue(value))}
      placeholder={placeholder || undefined}
      format={options.colorFormat}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      label={labelValue(label || undefined, hideLabel, false)}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      error={error}
      {...themeProps}
      popoverProps={{ withinPortal: false }}
      {...ariaDescribedByProps}
      {...getDescriptionProps(props)}
    />
  );
}
