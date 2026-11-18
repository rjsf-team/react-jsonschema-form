import type { FocusEvent, KeyboardEvent, MouseEvent } from 'react';
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { DateInput, DateTimePicker } from '@mantine/dates';
import type { DateStringValue } from '@mantine/dates';
import { useDidUpdate } from '@mantine/hooks';
import type { FormContextType, GenericObjectType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import {
  dateElementAriaLabel,
  dateElementLabel,
  getDateTimeLocalValue,
  labelValue,
  partId,
  TranslatableString,
  widgetDrawsLabel,
} from '@rjsf/utils';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

import {
  asObject,
  cleanupOptions,
  getDescriptionProps,
  getWidgetError,
  useInputAriaProps,
  getRequiredProps,
  ownIdOr,
  useThemeDefaultProps,
} from '../../utils.tsx';

// This plugin is needed to support the parsing of date and time values in the `DateWidget` and `DateTimeWidget`
dayjs.extend(customParseFormat);

const FORMAT_OPTIONS = new Set(['valueFormat', 'displayFormat']);
// `DateInput`'s own props, which `DateTimePicker` would pass on to its `<button>`
const DATE_TIME_EXCLUDED_OPTIONS = new Set([...FORMAT_OPTIONS, 'dateParser', 'fixOnBlur', 'allowDeselect']);

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

// The delay `useFocusReturn` in `@mantine/hooks` waits before a closed modal returns focus
const MANTINE_FOCUS_RETURN_DELAY = 10;

const isCallback = (value: unknown): value is (...args: unknown[]) => void => typeof value === 'function';

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
    required,
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
  const themeProps: GenericObjectType = cleanupOptions(
    options,
    props,
    withTime ? DATE_TIME_EXCLUDED_OPTIONS : FORMAT_OPTIONS,
  );

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

  // Read when the field's focus changes, which can come after a change made in the same event, such as the clamping
  // of an out-of-range value as the dropdown closes
  const latestRef = useRef({ id, value, onBlur, onFocus });
  useLayoutEffect(() => {
    latestRef.current = { id, value, onBlur, onFocus };
  });
  const reportBlur = useCallback(() => {
    const latest = latestRef.current;
    if (latest.onBlur) {
      latest.onBlur(latest.id, latest.value);
    }
  }, []);
  const reportFocus = useCallback(() => {
    const latest = latestRef.current;
    if (latest.onFocus) {
      latest.onFocus(latest.id, latest.value);
    }
  }, []);

  // A `DateTimePicker`'s field is its button, its dropdown and its modal, which focus moves between
  const component = withTime ? 'DateTimePicker' : 'DateInput';
  const themeDefaults = useThemeDefaultProps(component);
  const modalProps = { ...asObject(themeDefaults.modalProps), ...asObject(themeProps.modalProps) };
  const modalId = ownIdOr(modalProps, partId(id, 'modal'));
  const fieldRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const focusWithinRef = useRef(false);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const leaveField = useCallback(() => {
    // A field unmounted since has nothing left to blur
    if (focusWithinRef.current && fieldRef.current) {
      focusWithinRef.current = false;
      reportBlur();
    }
  }, [reportBlur]);
  const handleFieldFocus = useCallback(() => {
    clearTimeout(leaveTimerRef.current);
    if (!focusWithinRef.current) {
      focusWithinRef.current = true;
      reportFocus();
    }
  }, [reportFocus]);
  const handleFieldBlur = ({ relatedTarget }: FocusEvent<HTMLDivElement>) => {
    const field = fieldRef.current;
    // Focus going to an element outside the field and its modal leaves it now, before that element reports its focus
    if (
      relatedTarget &&
      field &&
      !field.contains(relatedTarget) &&
      !field.ownerDocument.getElementById(modalId)?.contains(relatedTarget)
    ) {
      leaveField();
      return;
    }
    // Focus an open modal drops, such as to a click on its overlay, is checked once the modal closes
    if (modalOpened) {
      return;
    }
    // Otherwise a focus inside the field that follows in the same task only moves focus within it
    leaveTimerRef.current = setTimeout(leaveField);
  };
  // Removing a focused element, such as the Clear button or the dropdown, moves focus to the body without a blur in
  // some browsers
  const leaveFieldIfFocusLost = useCallback(
    (delay?: number) => {
      setTimeout(() => {
        // Focus can still be in a dropdown or modal that is closing, which some browsers then remove without a blur
        if (buttonRef.current?.ownerDocument.activeElement !== buttonRef.current) {
          leaveField();
        }
      }, delay);
    },
    [leaveField],
  );
  // Runs after the commit that closes the modal, whose effect started its equal-delay focus-return timer first
  useDidUpdate(() => {
    if (!modalOpened) {
      leaveFieldIfFocusLost(MANTINE_FOCUS_RETURN_DELAY);
    }
  }, [modalOpened]);

  const parsedValue =
    requiresOffset || typeof value !== 'string' ? offsetValueParser(localValue) : dateParser(localValue, valueFormat);

  const ariaDescribedByProps = useInputAriaProps(component, props);
  const error = getWidgetError<T, S, F>(props);

  // The picker closes through the popover's `onClose`, which one in the options would replace
  const { onClose: _ignoredOnClose, ...popoverOptions } = {
    ...asObject(themeDefaults.popoverProps),
    ...asObject(themeProps.popoverProps),
  };
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
    error,
    clearable: themeDefaults.clearable !== false,
    ...themeProps,
    ...ariaDescribedByProps,
    ...getDescriptionProps(props),
    popoverProps: { ...popoverOptions, withinPortal: false },
    classNames: typeof options?.classNames === 'object' ? options.classNames : undefined,
    valueFormat: displayFormat,
    clearButtonProps: {
      'aria-label': registry.translateString(TranslatableString.ClearLabel),
      ...asObject(themeDefaults.clearButtonProps),
      ...asObject(themeProps.clearButtonProps),
    },
  };

  if (withTime) {
    const { translateString } = registry;
    // Named like `AltDateWidget`'s parts, so two date-time fields' segments can be told apart
    const timeLabel = (part: string) =>
      dateElementAriaLabel(dateElementLabel(part, translateString), translateString, label);
    const inModal = (themeProps.dropdownType ?? themeDefaults.dropdownType) === 'modal';
    // Mantine names the popover's dropdown as the one it controls, which a modal leaves unrendered
    const popoverProps: GenericObjectType =
      inModal && modalOpened ? { ...sharedProps.popoverProps, 'aria-controls': modalId } : sharedProps.popoverProps;
    return (
      // `display: contents` keeps it out of the layout, and React's focus events reach it from the modal's portal too
      <div ref={fieldRef} style={{ display: 'contents' }} onFocus={handleFieldFocus} onBlur={handleFieldBlur}>
        <DateTimePicker
          withSeconds={hasSeconds(valueFormat)}
          // A combobox, unlike a button, is announced with its shown text as its value, and as required or invalid
          // oxlint-disable-next-line jsx-a11y/role-has-required-aria-props -- Mantine's `Popover.Target` sets `aria-expanded`, and `aria-controls` while the picker is open
          role='combobox'
          aria-required={required || undefined}
          ref={buttonRef}
          {...sharedProps}
          popoverProps={popoverProps}
          modalProps={{ ...modalProps, id: modalId }}
          onClick={(event: MouseEvent<HTMLButtonElement>) => {
            const onClickOption = themeProps.onClick ?? themeDefaults.onClick;
            if (isCallback(onClickOption)) {
              onClickOption(event);
            }
            // The button is covered while the modal is open, so a click only opens it
            if (inModal) {
              setModalOpened(true);
            }
          }}
          onChange={(nextValue: DateStringValue | null) => {
            handleChange(nextValue);
            // Only the Clear button commits an empty value, and it is removed as it does
            if (!nextValue) {
              leaveFieldIfFocusLost();
            }
          }}
          // Down Arrow, or Alt+Down Arrow, opens a combobox, as Enter and Space open the button
          onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) => {
            const onKeyDownOption = themeProps.onKeyDown ?? themeDefaults.onKeyDown;
            if (isCallback(onKeyDownOption)) {
              onKeyDownOption(event);
            }
            if (
              !event.defaultPrevented &&
              event.key === 'ArrowDown' &&
              event.currentTarget.getAttribute('aria-expanded') !== 'true'
            ) {
              event.preventDefault();
              event.currentTarget.click();
            }
          }}
          onDropdownClose={() => {
            // A pointer submit removes the focused dropdown; a modal's close is checked once it could have returned focus
            if (inModal) {
              setModalOpened(false);
            } else {
              leaveFieldIfFocusLost();
            }
            const onDropdownCloseOption = themeProps.onDropdownClose ?? themeDefaults.onDropdownClose;
            if (isCallback(onDropdownCloseOption)) {
              onDropdownCloseOption();
            }
          }}
          timePickerProps={{
            hoursInputLabel: timeLabel('hour'),
            minutesInputLabel: timeLabel('minute'),
            secondsInputLabel: timeLabel('second'),
            ...asObject(themeDefaults.timePickerProps),
            ...asObject(themeProps.timePickerProps),
          }}
        />
      </div>
    );
  }

  // `clearable` would otherwise also let a click on the selected day clear it
  return (
    <DateInput
      allowDeselect={themeDefaults.allowDeselect === true}
      dateParser={(v) => dateParser(v, displayFormat)}
      onBlur={reportBlur}
      onFocus={reportFocus}
      {...sharedProps}
    />
  );
}
