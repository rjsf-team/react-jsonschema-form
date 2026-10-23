import type { ReactElement, ChangeEvent, FocusEvent } from 'react';
import { useCallback } from 'react';
import { Textarea } from '@mantine/core';
import type { StrictRJSFSchema, RJSFSchema, FormContextType, WidgetProps } from '@rjsf/utils';
import { labelValue, widgetDrawsLabel } from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps, getWidgetError, useInputAriaProps } from '../utils.tsx';

/** The `TextareaWidget` is a widget for rendering input fields as textarea.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TextareaWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>): ReactElement {
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
  const emptyValue = options?.emptyValue;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value === '' ? emptyValue : e.target.value);
    },
    [onChange, emptyValue],
  );

  const handleBlur = useCallback(
    ({ target }: FocusEvent<HTMLTextAreaElement>) => {
      if (onBlur) {
        onBlur(id, target?.value);
      }
    },
    [onBlur, id],
  );

  const handleFocus = useCallback(
    ({ target }: FocusEvent<HTMLTextAreaElement>) => {
      if (onFocus) {
        onFocus(id, target?.value);
      }
    },
    [onFocus, id],
  );

  const ariaDescribedByProps = useInputAriaProps('Textarea', props);
  const error = getWidgetError<T, S, F>(props);

  return (
    <Textarea
      id={id}
      name={htmlName || id}
      value={value || ''}
      placeholder={placeholder || undefined}
      rows={options.rows}
      required={required}
      disabled={disabled || readonly}
      autoFocus={autofocus}
      label={labelValue(label || undefined, hideLabel, false)}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      error={error}
      {...themeProps}
      {...ariaDescribedByProps}
      {...getDescriptionProps(props)}
    />
  );
}
