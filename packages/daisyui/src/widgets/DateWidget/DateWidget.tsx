import { memo, useCallback, useEffect, useMemo } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { format, isSameDay, isToday, isValid, startOfDay } from 'date-fns';
import type { ClassNames, ModifiersClassNames } from 'react-day-picker';
import { DayPicker, UI } from 'react-day-picker';

import { readDateOnly, useDateFormatter, useDatePicker } from '../datePickerHooks.ts';
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
 * @param text - A date-time beginning with a `YYYY-MM-DD` day
 * @returns - That day at local midnight, or `undefined` if the text does not begin with one
 */
function dayNamedBy(text: string) {
  const [day] = LEADING_DAY.exec(text) ?? [];
  return day ? readDateOnly(day) : undefined;
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
 * @returns - The day it names, or `undefined` for a value that cannot be parsed, which would otherwise become an
 *          `Invalid Date` that the calendar, its month caption and the trigger would each have to guard against
 */
function parseDateValue(raw: string | number | Date) {
  const text = typeof raw === 'string' ? raw.trim() : undefined;
  const dateOnly = text ? readDateOnly(text) : undefined;
  if (dateOnly) {
    return dateOnly;
  }
  // `Date` rather than `parseISO`, which rejects the lowercase separator and zone and the space separator RFC 3339 also
  // allows, as well as the epoch number that is not ISO text at all
  const instant = new Date(raw);
  const dayInItsOwnText = text ? dayNamedBy(text) : undefined;
  if (!isValid(instant)) {
    // Every one of those shapes is optional for an engine to accept, so a text naming a day outright is read as that
    // day rather than thrown away along with the instant no engine agreed on
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
  const initialDate = useMemo(() => {
    // Anything else — an object, a boolean — names no day, and `Date` would read it as `Invalid Date`
    if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
      return parseDateValue(value);
    }
    return undefined;
  }, [value]);
  const formatDate = useDateFormatter<S>(schema, 'date');
  const {
    isOpen,
    month,
    localDate,
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

  // Add a portal container to the document body if it doesn't exist
  useEffect(() => {
    // Check if the portal container exists, create it if not
    let portalContainer = document.getElementById('date-picker-portal');
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = 'date-picker-portal';
      document.body.appendChild(portalContainer);
    }

    // Clean up on unmount
    return () => {
      // Only remove if no other date pickers are using it and if portalContainer exists
      const container = document.getElementById('date-picker-portal');
      if (container && document.querySelectorAll('.date-picker-popup').length === 0) {
        container.remove();
      }
    };
  }, []);

  // Get the document and window objects (will work in iframes too)
  const getDocumentAndWindow = () => {
    // Try to get the iframe's document and window if we're in one
    let doc = document;
    let win = window;

    try {
      // If we're in an iframe, try to access the parent
      if (window.frameElement) {
        // We're in an iframe
        const iframe = window.frameElement as HTMLIFrameElement;
        // Get the iframe's contentDocument and contentWindow
        if (iframe.contentDocument) {
          doc = iframe.contentDocument;
        }
        if (iframe.contentWindow) {
          win = iframe.contentWindow as typeof window;
        }
      }
    } catch (e) {
      // Security error, we're in a cross-origin iframe
      // oxlint-disable-next-line no-console
      console.log('Unable to access parent frame:', e);
    }

    return { doc, win };
  };

  // Render the calendar at a specific position
  const renderCalendar = useCallback(() => {
    if (!containerRef.current || !triggerRef.current) {
      return;
    }

    // Get the proper document and window
    const { win } = getDocumentAndWindow();

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
    window.addEventListener('resize', renderCalendar);
    window.addEventListener('scroll', renderCalendar);

    return () => {
      window.removeEventListener('resize', renderCalendar);
      window.removeEventListener('scroll', renderCalendar);
    };
  }, [isOpen, renderCalendar]);

  const formattedValue = localDate ? format(localDate, 'PP') : undefined;

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
              selectedDate={localDate}
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
