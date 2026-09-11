import { useCallback } from 'react';
import { DateInput } from '@mantine/dates';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { ariaDescribedByIds, getDateTimeLocalValue, labelValue } from '@rjsf/utils';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

// This plugin is needed to support the parsing of date and time values in the `DateWidget` and `DateTimeWidget`
dayjs.extend(customParseFormat);

const dateParser = (input: string | undefined, format: string) => {
  if (!input) {
    return null;
  }
  const d = dayjs(input, format);
  return d.isValid() ? d.toDate() : null;
};

const dateFormat = (date?: Date, format?: string) => {
  if (!date || !dayjs(date).isValid()) {
    return '';
  }
  return dayjs(date).format(format || 'YYYY-MM-DD');
};

const offsetValueParser = (input: string | undefined) => {
  if (!input) {
    return null;
  }
  const d = dayjs(input);
  return d.isValid() ? d.toDate() : null;
};

const offsetValueFormatter = (date?: Date) => {
  if (!date || !dayjs(date).isValid()) {
    return '';
  }
  return date.toISOString();
};

/** The `DateTimeInput` is a base component that used by other Date-Time widget components. When `schema.format` is
 * `date-time` (or `datetime`), the value is converted to/from a UTC ISO string instead of the naive `valueFormat`
 * string, since that format requires a timezone offset (unlike `date` and `iso-date-time`, whose timezone is
 * either not applicable or optional). For `iso-date-time`, a stored value that happens to carry an offset anyway
 * is stripped before being parsed, so it displays as the naive wall-clock time it represents.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateTimeInput<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
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
    valueFormat,
    displayFormat,
    schema,
  } = props;

  const { isIsoDateTime, localValue } = getDateTimeLocalValue(schema, value);
  const requiresOffset = !isIsoDateTime && (schema.format === 'date-time' || schema.format === 'datetime');

  const handleChange = useCallback(
    (nextValue: any) => {
      onChange(requiresOffset ? offsetValueFormatter(nextValue) : dateFormat(nextValue, valueFormat as string));
    },
    [onChange, valueFormat, requiresOffset],
  );

  const handleBlur = useCallback(() => {
    if (onBlur) {
      onBlur(id, value);
    }
  }, [onBlur, id, value]);

  const handleFocus = useCallback(() => {
    if (onFocus) {
      onFocus(id, value);
    }
  }, [onFocus, id, value]);

  const parsedValue = requiresOffset
    ? offsetValueParser(value as string | undefined)
    : dateParser(localValue, valueFormat as string);

  return (
    <DateInput
      id={id}
      name={name}
      value={parsedValue}
      dateParser={(v) => dateParser(v, displayFormat as string)}
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
      popoverProps={{ withinPortal: false }}
      classNames={typeof options?.classNames === 'object' ? options.classNames : undefined}
      valueFormat={displayFormat}
    />
  );
}
