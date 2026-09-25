import type { ReactElement, ChangeEvent, FocusEvent } from 'react';
import { useCallback } from 'react';
import { Textarea } from '@mantine/core';
import type { StrictRJSFSchema, RJSFSchema, FormContextType, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, labelValue } from '@rjsf/utils';

import { cleanupOptions, getDescriptionProps, visibleErrorText } from '../utils.tsx';

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
    name,
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

  const themeProps = cleanupOptions(options);
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

  return (
    <Textarea
      id={id}
      name={htmlName || name}
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
      aria-describedby={ariaDescribedByIds(id)}
      {...themeProps}
      {...getDescriptionProps(props)}
    />
  );
}
