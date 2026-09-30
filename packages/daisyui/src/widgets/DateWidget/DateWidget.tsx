import { memo, useCallback, useEffect, useMemo } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { format, isSameDay, isToday, startOfDay } from 'date-fns';
import type { ClassNames, ModifiersClassNames } from 'react-day-picker';
import { DayPicker, UI } from 'react-day-picker';

import { readDateOnly, readInstant, useDateFormatter, useDatePicker, windowOf } from '../datePickerHooks.ts';
import DatePickerTrigger from '../DatePickerTrigger.tsx';
import 'react-day-picker/dist/style.css';

/**
 * Props for the DatePicker popup component
 */
interface DatePickerProps {
  /** Currently selected date */
  selectedDate?: Date;
  /** Currently displayed month */
  month: Date;
  /** Handler for month changes */
  onMonthChange: (date: Date) => void;
  /** Handler for date selection */
  onSelect: (date: Date | undefined) => void;
}

/**
 * Predefined DayPicker styles using DaisyUI classes
 */
const dayPickerStyles: { classNames: Partial<ClassNames>; modifiers: Partial<ModifiersClassNames> } = {
  classNames: {
    [UI.Root]: 'relative',
    [UI.Nav]: 'hidden',
    [UI.Chevron]: 'hidden',
    [UI.CaptionLabel]: 'hidden',
    [UI.Dropdowns]: 'flex justify-between gap-4 px-4 pb-4',
    [UI.Dropdown]: 'select select-bordered select-sm w-32',
    [UI.MonthsDropdown]: 'select select-bordered select-sm',
    [UI.YearsDropdown]: 'select select-bordered select-sm',
    [UI.Months]: 'flex justify-center',
    [UI.Month]: 'w-full',
    [UI.MonthCaption]: 'flex justify-center',
    [UI.MonthGrid]: 'w-full',
    [UI.Weekdays]: 'grid grid-cols-7 text-center border-b mb-2 pb-1 text-base-content/60 uppercase',
    [UI.Weekday]: 'p-1 font-medium text-base-content/60 text-sm',
    [UI.Week]: 'grid grid-cols-7',
    [UI.Day]: 'w-10 h-8 p-0 relative rounded-md',
    [UI.DayButton]:
      'btn btn-ghost absolute inset-0 flex items-center justify-center w-full h-full cursor-pointer rounded-md hover:btn-primary',
  },
  modifiers: {
    selected: 'btn btn-accent min-h-0 h-full',
    outside: 'text-base-content/30 hover:btn-ghost',
    disabled: 'opacity-50 cursor-not-allowed hover:btn-disabled',
  },
};

/**
 * Popup component for the calendar
 *
 * Renders a DayPicker calendar for selecting dates
 *
 * @param props - The DatePickerProps for this component
 */
function DatePickerPopup({ selectedDate, month, onMonthChange, onSelect }: DatePickerProps) {
  const customDayModifiers = {
    selected: selectedDate,
    'custom-today': (date: Date) => isToday(date) && !(selectedDate && isSameDay(date, selectedDate)),
  };

  const customModifiersClassNames: ModifiersClassNames = {
    ...dayPickerStyles.modifiers,
    'custom-today': 'btn btn-outline btn-info min-h-0 h-full',
  };

  return (
    <div className='p-3' style={{ minWidth: '320px', minHeight: '350px' }}>
      <DayPicker
        mode='single'
        selected={selectedDate}
        month={month}
        onMonthChange={onMonthChange}
        onSelect={onSelect}
        captionLayout='dropdown'
        startMonth={new Date(1900, 0)}
        endMonth={new Date(new Date().getFullYear() + 10, 11)}
        showOutsideDays
        classNames={dayPickerStyles.classNames}
        modifiers={customDayModifiers}
        modifiersClassNames={customModifiersClassNames}
      />
    </div>
  );
}

// Use React.memo to optimize re-renders
const MemoizedDatePickerPopup = memo(DatePickerPopup);

/** The calendar day at the front of a date-time, whatever separator, time and zone follow it */
const LEADING_DAY = /^\d{4}-\d{2}-\d{2}/;

/** A zone offset spelled as hours from UTC, which `Z` is not. It has to follow a time to count, so a bare `YYYY-MM`
 * is not read as May with a five-hour offset
 */
const NUMERIC_OFFSET = /\d{2}:\d{2}(:\d{2})?(\.\d+)?[+-]\d{2}(:?\d{2})?$/;

/** The calendar day a date-time's own text names, read as a day in its own right rather than through the `Date`
 * constructor, which reads a year below 100 as a two-digit one and would turn a stored year 50 into 1950.
 *
 * @param text - A date-time beginning with a `YYYY-MM-DD` day, or nothing where the stored value is not text
 * @returns - That day at local midnight, or `undefined` if the text does not begin with one
 */
function dayNamedBy(text?: string) {
  return readDateOnly(text?.match(LEADING_DAY)?.[0]);
}

/** Reads the stored value of a date field as the calendar day it stands for.
 *
 * A value carrying a time is not a `date` at all, and the day it names is the one its own text spells: whatever wrote
 * `2020-01-03T12:00:00Z` meant the third, and reading the instant where the calendar day differs would show the fourth
 * to a reader far enough east.
 *
 * The exception is the shape this widget stores for a field declaring a date-time: `toISOString()` of the midnight
 * beginning the day the user picked, in the zone they picked it in, whose text names the day before to everyone ahead
 * of UTC. It is told apart by its zone — a value stamped with an offset of its own came from somewhere else, and is
 * read as its text reads however that offset resolves here.
 *
 * @param raw - The stored value
 * @returns - The day it names, or `undefined` for a value that names none — an object or a boolean as much as an
 *          unreadable text
 */
function parseDateValue(raw: unknown) {
  const text = typeof raw === 'string' ? raw.trim() : undefined;
  const dateOnly = readDateOnly(text);
  if (dateOnly) {
    return dateOnly;
  }
  const instant = readInstant(raw);
  const dayInItsOwnText = dayNamedBy(text);
  if (!instant) {
    // Every dialect beyond ISO 8601 is optional for an engine to accept, so a text naming a day outright is read as
    // that day rather than thrown away along with the instant no engine agreed on
    return dayInItsOwnText;
  }
  const writtenByThisWidget =
    !(text && NUMERIC_OFFSET.test(text)) && instant.getTime() === startOfDay(instant).getTime();
  if (writtenByThisWidget) {
    return instant;
  }
  if (dayInItsOwnText) {
    return dayInItsOwnText;
  }
  // Left with a value whose text names no day at all — a `YYYY-MM`, or an epoch number that is not text to begin with.
  // A UTC midnight names the day `Date` resolved it to; anything else names only the day its instant lands on here
  const iso = instant.toISOString();
  return (iso.endsWith('T00:00:00.000Z') ? dayNamedBy(iso) : undefined) ?? instant;
}

/** The `DateWidget` component provides a date picker with DaisyUI styling.
 *
 * Features:
 * - Calendar popup with month/year dropdown navigation
 * - Accessible keyboard navigation
 * - Date formatting using date-fns
 * - Date-only selection (time component set to 00:00:00)
 * - Manages focus and blur events for accessibility
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateWidget<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, value, label, name, hideLabel, placeholder, options, disabled, readonly, schema, registry } = props;
  const initialDate = useMemo(() => parseDateValue(value), [value]);
  const formatDate = useDateFormatter<S>(schema, 'date');
  const {
    isOpen,
    month,
    displayedDate,
    containerRef,
    triggerRef,
    chooseDate,
    handleMonthChange,
    togglePicker,
    handleFocus,
    handleBlur,
    handleDone,
  } = useDatePicker({ ...props, initialDate, formatDate, emptyValue: options.emptyValue });

  // Take the day the user picked, with no time component, since a `date` names none.
  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        chooseDate(startOfDay(date));
      }
    },
    [chooseDate],
  );

  // Render the calendar at a specific position
  const renderCalendar = useCallback(() => {
    if (!containerRef.current || !triggerRef.current) {
      return;
    }

    // The rect below is measured against the viewport of the window the form is in, so that is the width to keep the
    // popup inside of
    const win = windowOf(triggerRef.current);

    const inputRect = triggerRef.current.getBoundingClientRect();
    const containerWidth = 320; // Minimum width we've set

    // Position the calendar relative to the input but with fixed positioning
    containerRef.current.style.position = 'fixed';
    containerRef.current.style.top = `${inputRect.bottom + 5}px`;

    // Prevent it from going off-screen on the right
    const rightEdge = inputRect.left + containerWidth;
    const windowWidth = win.innerWidth;

    if (rightEdge > windowWidth - 20) {
      // Align to the right edge if it would overflow
      containerRef.current.style.left = `${Math.max(20, windowWidth - 20 - containerWidth)}px`;
    } else {
      // Otherwise align to the left edge of the input
      containerRef.current.style.left = `${inputRect.left}px`;
    }

    // Ensure the calendar is visible
    containerRef.current.style.zIndex = '99999';
  }, [containerRef, triggerRef]);

  // Handle window resize to reposition the calendar
  useEffect(() => {
    if (!isOpen) {
      return () => {};
    }

    // Position initially
    renderCalendar();

    // Update position on resize
    const win = windowOf(triggerRef.current);
    win.addEventListener('resize', renderCalendar);
    win.addEventListener('scroll', renderCalendar);

    return () => {
      win.removeEventListener('resize', renderCalendar);
      win.removeEventListener('scroll', renderCalendar);
    };
  }, [isOpen, renderCalendar, triggerRef]);

  const formattedValue = displayedDate ? format(displayedDate, 'PP') : undefined;

  return (
    <div className='form-control my-4 w-full relative'>
      <div className='w-full'>
        <DatePickerTrigger<T, S, F>
          id={id}
          label={label}
          name={name}
          hideLabel={hideLabel}
          placeholder={placeholder}
          formattedValue={formattedValue}
          isOpen={isOpen}
          disabled={disabled}
          readonly={readonly}
          triggerRef={triggerRef}
          onClick={togglePicker}
          onFocus={handleFocus}
          onBlur={handleBlur}
          registry={registry}
        />
        {isOpen && (
          <div
            ref={containerRef}
            role='presentation'
            className='date-picker-popup fixed z-[99999] w-full max-w-xs bg-base-100 border border-base-300 shadow-lg rounded-box'
            style={{
              maxHeight: 'none',
              overflow: 'visible',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <MemoizedDatePickerPopup
              selectedDate={displayedDate}
              month={month}
              onMonthChange={handleMonthChange}
              onSelect={handleSelect}
            />
            <div className='p-3 flex justify-end border-t border-base-300'>
              <button type='button' className='btn btn-sm btn-primary' onClick={handleDone}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
