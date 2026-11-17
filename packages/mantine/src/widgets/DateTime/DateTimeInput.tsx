import type { FocusEvent } from 'react';
import { useCallback, useMemo, useRef } from 'react';
import { DateInput, DateTimePicker } from '@mantine/dates';
import type { DateStringValue } from '@mantine/dates';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getDateTimeLocalValue, labelValue, TranslatableString, widgetDrawsLabel } from '@rjsf/utils';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

import {
  asObject,
  cleanupOptions,
  getDescriptionProps,
  getWidgetError,
  useInputAriaProps,
  getRequiredProps,
} from '../../utils.tsx';

// This plugin is needed to support the parsing of date and time values in the `DateWidget` and `DateTimeWidget`
dayjs.extend(customParseFormat);

const FORMAT_OPTIONS = new Set(['valueFormat', 'displayFormat']);

const dateParser = (input: string | undefined, format: string) => {
  if (!input) {
    return null;
  }
  const d = dayjs(input, format);
  return d.isValid() ? d.toDate() : null;
};

const dateFormat = (date?: DateStringValue | null, format?: string) => {
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
  // `DateTimePicker`'s `onChange` passes a `DateStringValue` (a `YYYY-MM-DD HH:mm:ss` string), as do `DateInput`'s
  // calendar-click and preset interactions (a plain `YYYY-MM-DD`); only `DateInput`'s typed-input path (via
  // `dateParser` below) produces a real `Date`. Route both through dayjs rather than assuming `Date#toISOString()`.
  const d = dayjs(value);
  return value && d.isValid() ? d.toISOString() : '';
};

/** Whether a dayjs `format` has a seconds token, ignoring the text of its `[...]` literals */
const hasSeconds = (format: string) => format.replace(/\[[^\]]*\]/g, '').includes('s');

/** The `DateTimeInput` is a base component that used by other Date-Time widget components. With `withTime`, it
 * renders Mantine's `DateTimePicker`, a dropdown with a calendar and a time picker, instead of the typed `DateInput`.
 * When `schema.format` is `date-time` (or `datetime`), the value is converted to/from a UTC ISO string instead of the
 * naive `valueFormat` string, since that format requires a timezone offset (unlike `date` and `iso-date-time`, whose
 * timezone is either not applicable or optional). For `iso-date-time`, a stored value that happens to carry an offset
 * anyway is stripped before being parsed, so it displays as the naive wall-clock time it represents.
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateTimeInput<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  props: WidgetProps<T, S, F> & {
    /** The dayjs format the value is stored in, without a `valueFormat` option */
    defaultValueFormat: string;
    /** Whether to render the `DateTimePicker`, which picks a time as well as a date */
    withTime?: boolean;
  },
) {
  const {
    id,
    htmlName,
    value,
    placeholder,
    disabled,
    readonly,
    autofocus,
    label,
    options,
    onChange,
    onBlur,
    onFocus,
    defaultValueFormat,
    withTime,
    schema,
    registry,
  } = props;
  const hideLabel = !widgetDrawsLabel<T, S, F>(props);
  const valueFormat = typeof options.valueFormat === 'string' ? options.valueFormat : defaultValueFormat;
  const displayFormat =
    typeof options.displayFormat === 'string' && options.displayFormat ? options.displayFormat : valueFormat;

  const { requiresOffset, localValue } = useMemo(() => getDateTimeLocalValue(schema, value), [schema, value]);
  const themeProps = cleanupOptions(options, props, FORMAT_OPTIONS);

  const handleChange = useCallback(
    (nextValue: DateStringValue | null) => {
      if (!nextValue) {
        onChange(options.emptyValue);
        return;
      }
      onChange(requiresOffset ? offsetValueFormatter(nextValue) : dateFormat(nextValue, valueFormat));
    },
    [onChange, valueFormat, requiresOffset, options.emptyValue],
  );

  const reportBlur = useCallback(() => {
    if (onBlur) {
      onBlur(id, value);
    }
  }, [onBlur, id, value]);

  const focusInDropdownRef = useRef(false);

  const handleBlur = useCallback(
    ({ relatedTarget }: FocusEvent<HTMLElement>) => {
      // Opening the `DateTimePicker` moves focus into its dropdown, which is still the field; closing it reports the blur
      if (
        withTime &&
        relatedTarget instanceof Element &&
        relatedTarget.closest('[data-dates-dropdown], [data-dates-modal]')
      ) {
        focusInDropdownRef.current = true;
        return;
      }
      reportBlur();
    },
    [reportBlur, withTime],
  );

  const handleFocus = useCallback(() => {
    if (onFocus) {
      onFocus(id, value);
    }
  }, [onFocus, id, value]);

  const parsedValue =
    requiresOffset || typeof value !== 'string' ? offsetValueParser(localValue) : dateParser(localValue, valueFormat);

  const ariaDescribedByProps = useInputAriaProps(withTime ? 'DateTimePicker' : 'DateInput', props);
  const error = getWidgetError<T, S, F>(props);

  const sharedProps = {
    id,
    name: htmlName || id,
    value: parsedValue,
    placeholder: placeholder || undefined,
    ...getRequiredProps<T, S, F>(props),
    disabled: disabled || readonly,
    autoFocus: autofocus,
    label: labelValue(label || undefined, hideLabel, false),
    onChange: handleChange,
    onBlur: handleBlur,
    onFocus: handleFocus,
    error,
    clearable: true,
    ...themeProps,
    ...ariaDescribedByProps,
    ...getDescriptionProps(props),
    popoverProps: { withinPortal: false },
    classNames: typeof options?.classNames === 'object' ? options.classNames : undefined,
    valueFormat: displayFormat,
    clearButtonProps: {
      'aria-label': registry.translateString(TranslatableString.ClearLabel),
      ...asObject(options.clearButtonProps),
    },
  };

  if (withTime) {
    const { translateString } = registry;
    // Named like `AltDateWidget`'s parts, so two date-time fields' segments can be told apart
    const timeLabel = (part: TranslatableString) =>
      label
        ? translateString(TranslatableString.DateElementAriaLabel, [label, translateString(part)])
        : translateString(part);
    return (
      <DateTimePicker
        withSeconds={hasSeconds(valueFormat)}
        {...sharedProps}
        onDropdownClose={() => {
          // A submit or Enter calls this twice, once as it closes the dropdown and again from the popover closing
          if (focusInDropdownRef.current) {
            focusInDropdownRef.current = false;
            reportBlur();
          }
          if (typeof options.onDropdownClose === 'function') {
            (options.onDropdownClose as () => void)();
          }
        }}
        timePickerProps={{
          hoursInputLabel: timeLabel(TranslatableString.HourLabel),
          minutesInputLabel: timeLabel(TranslatableString.MinuteLabel),
          secondsInputLabel: timeLabel(TranslatableString.SecondLabel),
          ...asObject(options.timePickerProps),
        }}
      />
    );
  }

  // `clearable` would otherwise also let a click on the selected day clear it
  return <DateInput allowDeselect={false} {...sharedProps} dateParser={(v) => dateParser(v, displayFormat)} />;
}
