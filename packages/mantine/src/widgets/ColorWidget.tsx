import type { FocusEvent } from 'react';
import { useCallback } from 'react';
import type { ColorInputProps } from '@mantine/core';
import { ColorInput } from '@mantine/core';
import type { DateElementFormat, FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { labelValue, widgetDrawsLabel } from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps, useAriaDescribedByProps, useVisibleErrors } from '../utils.tsx';

// A record, not a list, so that an order the alt-date widgets gain fails typecheck until it is listed here. Only those
// orders are left out, so that a format a later Mantine release adds to `ColorInput` still reaches it.
const dateElementFormatRecord: Record<DateElementFormat, true> = { DMY: true, MDY: true, YMD: true };

/** The `format` to pass on to `ColorInput`. `format` is also the alt-date widgets' option, so one of their orders, such
 * as `DMY`, is left out, and Mantine's default or the theme's applies instead.
 */
function colorFormat(format: unknown): ColorInputProps['format'] {
  return typeof format === 'string' && !Object.hasOwn(dateElementFormatRecord, format)
    ? (format as ColorInputProps['format'])
    : undefined;
}

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
  const error = useVisibleErrors(props);

  return (
    <ColorInput
      id={id}
      name={htmlName || id}
      value={value || ''}
      placeholder={placeholder || undefined}
      format={colorFormat(options.format)}
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
