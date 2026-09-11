import type { ChangeEvent, FocusEvent } from 'react';
import { useCallback } from 'react';
import { TimeInput } from '@mantine/dates';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { labelValue, ariaDescribedByIds, useTimeWidgetProps } from '@rjsf/utils';

/** The `TimeWidget` component uses the `TimeInput` component from `@mantine/dates` for rendering.
 *
 * On change, the local UTC offset is appended to the value so the stored `time` is compliant with the
 * JSON Schema `time` format (RFC 3339 `full-time`), which requires a timezone; the offset is always stripped
 * back off for display, since `TimeInput` doesn't understand it. `TimeInput` defaults to minute precision, so
 * seconds are padded on before the offset is appended, since `full-time` requires seconds. When
 * `schema.format` is `iso-time`, the offset is not added on change, since that format's timezone is
 * optional, but a stored value that happens to carry one is still stripped for display.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function TimeWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
  const {
    id,
    name,
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

  const { localValue: displayValue, computeTimeValue } = useTimeWidgetProps(props);
  const emptyValue = options.emptyValue || '';

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      if (newValue === '') {
        onChange(emptyValue);
      } else {
        onChange(computeTimeValue(newValue));
      }
    },
    [onChange, emptyValue, computeTimeValue],
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

  return (
    <TimeInput
      id={id}
      name={name}
      value={displayValue || ''}
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
      aria-describedby={ariaDescribedByIds(id)}
      classNames={typeof options?.classNames === 'object' ? options.classNames : undefined}
    />
  );
}
