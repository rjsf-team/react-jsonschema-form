import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { format, isValid, isToday, isSameDay } from 'date-fns';
import { DayPicker, ClassNames, ModifiersClassNames, UI } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';

//
// Types
//
interface DateTimePickerProps {
  selectedDate?: Date;
  month: Date;
  onMonthChange: (date: Date) => void;
  onSelect: (date: Date | undefined) => void;
}

//
// Hook to manage popup state and the displayed month
//
const useDatePickerState = (initialDate?: Date) => {
  const [isOpen, setIsOpen] = useState(false);
  const [month, setMonth] = useState<Date>(initialDate ?? new Date());
  return { isOpen, setIsOpen, month, setMonth };
};

//
// Hook for detecting clicks outside of a container
//
const useClickOutside = (ref: React.RefObject<HTMLDivElement>, callback: () => void) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, callback]);
};

//
// Predefined DayPicker styles using DaisyUI classes
//
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
    // today: 'btn btn-outline btn-info min-h-0 h-full',
    outside: 'text-base-content/30 hover:btn-ghost',
    disabled: 'opacity-50 cursor-not-allowed hover:btn-disabled',
  },
};

//
// Popup component for the calendar.
// Wrapped with React.memo to avoid unnecessary re‑renders.
//
const DateTimePickerPopup: React.FC<DateTimePickerProps> = React.memo(
  ({ selectedDate, month, onMonthChange, onSelect }) => {
    const customDayModifiers = {
      selected: selectedDate, // DayPicker uses this for tracking selection.
      'custom-today': (date: Date) => isToday(date) && !(selectedDate && isSameDay(date, selectedDate)),
    };

    const customModifiersClassNames: ModifiersClassNames = {
      selected: dayPickerStyles.modifiers.selected as string,
      'custom-today': 'btn btn-outline btn-info min-h-0 h-full',
    };

    return (
      <div>
        <DayPicker
          captionLayout='dropdown'
          classNames={dayPickerStyles.classNames}
          fromYear={1800}
          toYear={2025}
          mode='single'
          modifiers={customDayModifiers}
          modifiersClassNames={customModifiersClassNames}
          month={month}
          onMonthChange={onMonthChange}
          onSelect={onSelect}
          selected={selectedDate}
          showOutsideDays
        />
      </div>
    );
  }
);

//
// Main widget component
//
const DateTimeWidget = <T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>
) => {
  const { id, value, onChange, schema } = props;
  // Initialize the local date from the parent's value.
  const initialDate = useMemo(() => (value ? new Date(value) : undefined), [value]);
  const [localDate, setLocalDate] = useState<Date | undefined>(initialDate);

  // When the parent's value changes externally, update local state.
  useEffect(() => {
    setLocalDate(initialDate);
  }, [initialDate]);

  const { isOpen, setIsOpen, month, setMonth } = useDatePickerState(initialDate);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the popup when clicking outside and commit changes.
  useClickOutside(containerRef, () => {
    setIsOpen(false);
    onChange(localDate ? localDate.toISOString() : '');
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
  const handleSelect = useCallback((date: Date | undefined) => {
    if (date) {
      // Remove any time component by setting hours, minutes, seconds, and milliseconds to zero.
      date.setHours(0, 0, 0, 0);
      setLocalDate(date);
    }
  }, []);

  // Toggle popup visibility.
  const togglePicker = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOpen((prev) => !prev);
    },
    [setIsOpen]
  );

  return (
    <div ref={containerRef} className='form-control my-4 w-full relative'>
      <div
        className='w-full'
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            togglePicker(e as unknown as React.MouseEvent);
          }
        }}
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
            {localDate && isValid(localDate) ? format(localDate, 'PP') : schema.title}
          </span>
          <FontAwesomeIcon icon={faCalendar} className='ml-2 h-4 w-4 text-primary-content' />
        </div>
        {isOpen && (
          <div className='absolute z-50 mt-2 w-full max-w-xs bg-base-100 border border-base-300 shadow-lg rounded-box p-4'>
            <DateTimePickerPopup
              selectedDate={localDate}
              month={month}
              onMonthChange={handleMonthChange}
              onSelect={handleSelect}
            />
            <div className='mt-2 flex justify-end'>
              <button
                type='button'
                className='btn btn-sm btn-primary'
                onClick={() => {
                  setIsOpen(false);
                  onChange(localDate ? localDate.toISOString() : '');
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DateTimeWidget;
