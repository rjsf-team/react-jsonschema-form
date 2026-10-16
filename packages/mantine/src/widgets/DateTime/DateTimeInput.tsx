import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { Box, Group } from '@mantine/core';
import { assignTime, DateInput, TimePicker } from '@mantine/dates';
import type { DateStringValue } from '@mantine/dates';
import type { FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  ariaDescribedByIds,
  dateElementAriaLabel,
  dateElementLabel,
  getDateTimeLocalValue,
  labelValue,
  TranslatableString,
  widgetDrawsLabel,
} from '@rjsf/utils';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

import { cleanupOptions, getDescriptionProps, getWidgetError, useInputAriaProps } from '../../utils.tsx';

// This plugin is needed to support the parsing of date and time values in the `DateWidget` and `DateTimeWidget`
dayjs.extend(customParseFormat);

const dateParser = (input: string | undefined, format: string) => {
  if (!input) {
    return null;
  }
  const d = dayjs(input, format);
  return d.isValid() ? d.toDate() : null;
};

const dateFormat = (date?: DateStringValue | Date | null, format?: string) => {
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

const offsetValueFormatter = (value?: DateStringValue | Date | null) => {
  // `DateInput`'s `onChange` passes a `DateStringValue` (a plain `YYYY-MM-DD` string) for the primary
  // calendar-click and preset interactions, not a `Date`; only the typed-input path (via `dateParser` below)
  // produces a real `Date`. Route both through dayjs rather than assuming `Date#toISOString()`.
  const d = dayjs(value);
  return value && d.isValid() ? d.toISOString() : '';
};

const TIME_FORMAT = 'HH:mm:ss';
const DATE_ONLY_FORMAT = 'YYYY-MM-DD';
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const withTimeOfDay = (date: DateStringValue | Date, time: string) => {
  const dateString = dayjs(date).format(DATE_ONLY_FORMAT);
  return dayjs(assignTime(dateString, time)).toDate();
};

/** The `DateTimeInput` is a base component that used by other Date-Time widget components. When `schema.format` is
 * `date-time` (or `datetime`), the value is converted to/from a UTC ISO string instead of the naive `valueFormat`
 * string, since that format requires a timezone offset (unlike `date` and `iso-date-time`, whose timezone is
 * either not applicable or optional). For `iso-date-time`, a stored value that happens to carry an offset anyway
 * is stripped before being parsed, so it displays as the naive wall-clock time it represents.
 *
 * When `withTime` is set, a `TimePicker` is rendered beside the `DateInput`, inside the same field wrapper, so the
 * time can be picked as well as typed. A calendar click passes a date-only value, so the current time of day is kept
 * on it. A time picked before there is a date is held until one is picked, since the value can't be committed without
 * a date. The hours segment, the only one in the tab order, is described by the field's ids like the date input.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateTimeInput<
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
    valueFormat,
    displayFormat,
    withTime,
    schema,
    registry,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);

  const { requiresOffset, localValue } = useMemo(() => getDateTimeLocalValue(schema, value), [schema, value]);
  const themeProps = cleanupOptions(options, ['timePickerProps']);
  const { timePickerProps } = options;
  const [pendingTime, setPendingTime] = useState('');

  const parsedValue = useMemo(
    () =>
      requiresOffset || typeof value !== 'string'
        ? offsetValueParser(localValue)
        : dateParser(localValue, valueFormat as string),
    [requiresOffset, value, localValue, valueFormat],
  );
  const timeValue = parsedValue ? dayjs(parsedValue).format(TIME_FORMAT) : pendingTime;

  const commit = useCallback(
    (nextValue: DateStringValue | Date | null) => {
      onChange(requiresOffset ? offsetValueFormatter(nextValue) : dateFormat(nextValue, valueFormat as string));
    },
    [onChange, valueFormat, requiresOffset],
  );

  const handleChange = useCallback(
    (nextValue: DateStringValue | Date | null) => {
      const isDateOnly = typeof nextValue === 'string' && DATE_ONLY_PATTERN.test(nextValue);
      commit(withTime && nextValue && isDateOnly ? withTimeOfDay(nextValue, timeValue || '00:00:00') : nextValue);
      setPendingTime('');
    },
    [commit, withTime, timeValue],
  );

  const handleTimeChange = useCallback(
    (nextTime: string) => {
      // `TimePicker` passes an empty string while a segment is incomplete, which shouldn't wipe the stored value
      if (!nextTime) {
        return;
      }
      if (parsedValue) {
        commit(withTimeOfDay(parsedValue, nextTime));
      } else {
        setPendingTime(nextTime);
      }
    },
    [commit, parsedValue],
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

  const ariaDescribedByProps = useInputAriaProps('DateInput', props);
  const error = getWidgetError<T, S, F>(props);

  const ariaContainer = ariaDescribedByProps.inputContainer;
  const { translateString } = registry;
  const withSeconds =
    (typeof displayFormat === 'string' && displayFormat.includes('s')) ||
    (typeof valueFormat === 'string' && valueFormat.includes('s'));
  const timeContainer = useCallback(
    (children: ReactNode) =>
      ariaContainer(
        <Group gap='xs' wrap='nowrap' align='flex-start'>
          <Box flex={1}>{children}</Box>
          <TimePicker
            {...themeProps}
            {...(timePickerProps as GenericObjectType | undefined)}
            value={timeValue}
            onChange={handleTimeChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            withSeconds={withSeconds}
            disabled={disabled}
            readOnly={readonly}
            error={!!error}
            role='group'
            aria-label={dateElementAriaLabel(
              dateElementLabel(TranslatableString.TimeLabel, translateString),
              translateString,
              label,
            )}
            hoursInputLabel={dateElementLabel(TranslatableString.HourLabel, translateString)}
            minutesInputLabel={dateElementLabel(TranslatableString.MinuteLabel, translateString)}
            secondsInputLabel={dateElementLabel(TranslatableString.SecondLabel, translateString)}
            hoursInputProps={{
              id: `${id}-time`,
              'aria-describedby': ariaDescribedByIds(id),
              'aria-invalid': !!error || undefined,
              ...timePickerProps?.hoursInputProps,
            }}
            popoverProps={{ withinPortal: false, ...timePickerProps?.popoverProps }}
          />
        </Group>,
      ),
    [
      ariaContainer,
      id,
      timeValue,
      handleTimeChange,
      handleFocus,
      handleBlur,
      disabled,
      readonly,
      error,
      label,
      timePickerProps,
      themeProps,
      translateString,
      withSeconds,
    ],
  );
  const containerProps = useMemo(
    () =>
      withTime
        ? {
            ...ariaDescribedByProps,
            inputContainer: timeContainer,
            wrapperProps: { ...ariaDescribedByProps.wrapperProps, inputContainer: timeContainer },
          }
        : ariaDescribedByProps,
    [withTime, ariaDescribedByProps, timeContainer],
  );

  return (
    <DateInput
      id={id}
      name={htmlName || id}
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
      error={error}
      {...themeProps}
      {...containerProps}
      {...getDescriptionProps(props)}
      popoverProps={{ withinPortal: false }}
      classNames={typeof options?.classNames === 'object' ? options.classNames : undefined}
      valueFormat={displayFormat}
      withTime={!!withTime}
    />
  );
}
