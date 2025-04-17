import { ChangeEvent, memo, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { format, isSameDay, isToday, isValid } from 'date-fns';
import { ClassNames, DayPicker, ModifiersClassNames, UI } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

/**
 * Props for the DateTimePicker popup component
 */
interface DateTimePickerProps {
  /** Currently selected date */
  selectedDate?: Date;
  /** Currently displayed month */
  month: Date;
  /** Handler for month changes */
  onMonthChange: (date: Date) => void;
  /** Handler for date selection */
  onSelect: (date: Date | undefined) => void;
  /** Handler for time input changes */
  onTimeChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Custom hook to manage the picker's popup state and displayed month
 *
 * @param initialDate - Initial date to display, defaults to today
 * @returns State and handlers for the date picker
 */
function useDatePickerState(initialDate?: Date) {
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState<Date>(initialDate ?? new Date());
  return { isOpen, setIsOpen, month, setMonth };
}

/**
 * Custom hook to detect clicks outside an element and run a callback
 *
 * @param ref - React ref to the element to monitor
 * @param callback - Function to call when a click outside is detected
 */
function useClickOutside(ref: RefObject<HTMLDivElement>, callback: () => void) {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, callback]);
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
 * Popup component for the calendar and time input
 *
 * Renders a DayPicker calendar with time input for selecting date and time
 *
 * @param props - The DateTimePickerProps for this component
 */
function DateTimePickerPopup({ selectedDate, month, onMonthChange, onSelect, onTimeChange }: DateTimePickerProps) {
  const customDayModifiers = {
    selected: selectedDate,
    'custom-today': (date: Date) => isToday(date) && !(selectedDate && isSameDay(date, selectedDate)),
  };

  const customModifiersClassNames: ModifiersClassNames = {
    ...dayPickerStyles.modifiers,
    'custom-today': 'btn btn-outline btn-info min-h-0 h-full',
  };

  // Memoize click handler to stop event propagation
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <div className='p-3'>
      <DayPicker
        mode='single'
        selected={selectedDate}
        month={month}
        onMonthChange={onMonthChange}
        onSelect={onSelect}
        captionLayout='dropdown'
        fromYear={1900}
        toYear={new Date().getFullYear() + 10}
        showOutsideDays
        classNames={dayPickerStyles.classNames}
        modifiers={customDayModifiers}
        modifiersClassNames={customModifiersClassNames}
      />

      <div className='mt-3 border-t border-base-300 pt-3'>
        <div className='form-control w-full'>
          <label className='label'>
            <span className='label-text'>Time</span>
          </label>
          <input
            type='time'
            className='input input-bordered w-full'
            value={selectedDate ? format(selectedDate, 'HH:mm') : ''}
            onChange={onTimeChange}
            onClick={handleClick}
          />
        </div>
      </div>
    </div>
  );
}

// Use memo to optimize re-renders
const MemoizedDateTimePickerPopup = memo(DateTimePickerPopup);

/** The `DateTimeWidget` component provides a date and time picker with DaisyUI styling.
 *
 * Features:
 * - Calendar popup with month/year navigation
 * - Time input field
 * - Accessible keyboard navigation
 * - Date formatting using date-fns
 * - Manages focus and blur events for accessibility
 *
 * @param props - The `WidgetProps` for this component
 */
export default function DateTimeWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(props: WidgetProps<T, S, F>) {
  const { id, value, onChange, onFocus, onBlur, schema } = props;
  // Initialize the local date from the parent's value.
  const initialDate = useMemo(() => (value ? new Date(value) : undefined), [value]);
  const [localDate, setLocalDate] = useState<Date | undefined>(initialDate);

  // When the parent's value changes externally, update local state.
  useEffect(() => {
    setLocalDate(initialDate);
  }, [initialDate]);

  const { isOpen, setIsOpen, month, setMonth } = useDatePickerState(initialDate);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);

  // Close the popup when clicking outside and commit changes.
  useClickOutside(containerRef, () => {
    if (isOpen) {
      setIsOpen(false);
      onChange(localDate ? localDate.toISOString() : '');
      // Manually invoke the blur handler to ensure blur event is triggered
      if (onBlur) {
        onBlur(id, value);
      }
    }
  });

  // When the local date changes, update the displayed month.
  useEffect(() => {
    if (localDate) {
      setMonth(localDate);
    }
  }, [localDate, setMonth]);

  // Update the month when the user navigates the calendar.
  const handleMonthChange = useCallback((date: Date) => setMonth(date), [setMonth]);

  // Update local state on day selection (but do not commit immediately).
  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        if (localDate) {
          date.setHours(localDate.getHours(), localDate.getMinutes());
        }
        setLocalDate(date);
      }
    },
    [localDate],
  );

  // Update local state on time change.
  const handleTimeChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (localDate) {
        const [hours, minutes] = e.target.value.split(':');
        const newDate = new Date(localDate);
        newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
        setLocalDate(newDate);
      }
    },
    [localDate],
  );

  // Toggle popup visibility.
  const togglePicker = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOpen((prev) => !prev);
      if (!isOpen && onFocus) {
        onFocus(id, value);
      }
    },
    [isOpen, id, onFocus, setIsOpen, value],
  );

  // Handle focus event
  const handleFocus = useCallback(() => {
    if (onFocus) {
      onFocus(id, value);
    }
  }, [id, onFocus, value]);

  // Handle blur event
  const handleBlur = useCallback(() => {
    if (!isOpen && onBlur) {
      onBlur(id, value);
    }
  }, [id, onBlur, value, isOpen]);

  // Handle keydown events for accessibility
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        togglePicker(e as unknown as React.MouseEvent);
      }
    },
    [togglePicker],
  );

  // Prevent event propagation for popup container
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Close popup on escape key
  useEffect(() => {
    const handleEscape = (e: React.KeyboardEvent | KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        if (onBlur) {
          onBlur(id, value);
        }
      }
    };

    // Need to use native DOM events since we're attaching to document
    document.addEventListener('keydown', handleEscape as (e: KeyboardEvent) => void);
    return () => document.removeEventListener('keydown', handleEscape as (e: KeyboardEvent) => void);
  }, [id, isOpen, onBlur, value]);

  // Add the handleDoneClick callback near the top of the component, with the other event handlers
  /** Handle clicking the "Done" button
   */
  const handleDoneClick = useCallback(() => {
    setIsOpen(false);
    onChange(localDate ? localDate.toISOString() : '');
    if (onBlur) {
      onBlur(id, value);
    }
    inputRef.current?.focus();
  }, [localDate, onChange, onBlur, id, value]);

  return (
    <div className='form-control my-4 w-full relative'>
      <div
        className='w-full'
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        ref={inputRef}
      >
        <div
          id={id}
          className={`input input-bordered w-full flex items-center justify-between cursor-pointer ${
            isOpen ? 'ring-2 ring-primary/50' : ''
          }`}
          onClick={togglePicker}
          role='button'
          aria-haspopup='true'
          aria-expanded={isOpen}
          tabIndex={-1}
        >
          <span className={localDate && isValid(localDate) ? '' : 'text-base-content/50'}>
            {localDate && isValid(localDate) ? format(localDate, 'PP p') : schema.title}
          </span>
          <FontAwesomeIcon icon={faCalendar} className='ml-2 h-4 w-4 text-primary' />
        </div>
        {isOpen && (
          <div
            ref={containerRef}
            className='absolute z-[100] mt-2 w-full max-w-xs bg-base-100 border border-base-300 shadow-lg rounded-box'
            onClick={handleContainerClick}
          >
            <MemoizedDateTimePickerPopup
              selectedDate={localDate}
              month={month}
              onMonthChange={handleMonthChange}
              onSelect={handleSelect}
              onTimeChange={handleTimeChange}
            />
            <div className='p-3 flex justify-end border-t border-base-300'>
              <button type='button' className='btn btn-sm btn-primary' onClick={handleDoneClick}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
