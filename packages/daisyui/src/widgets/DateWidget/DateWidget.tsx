import { memo, RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { faCalendar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { format, isSameDay, isToday, isValid } from 'date-fns';
import { ClassNames, DayPicker, ModifiersClassNames, UI } from 'react-day-picker';
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
        fromYear={1900}
        toYear={new Date().getFullYear() + 10}
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
export default function DateWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>(
  props: WidgetProps<T, S, F>,
) {
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
  const handleSelect = useCallback((date: Date | undefined) => {
    if (date) {
      // Remove any time component by setting hours, minutes, seconds, and milliseconds to zero.
      date.setHours(0, 0, 0, 0);
      setLocalDate(date);
    }
  }, []);

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
      console.log('Unable to access parent frame:', e);
    }

    return { doc, win };
  };

  // Render the calendar at a specific position
  const renderCalendar = useCallback(() => {
    if (!containerRef.current || !inputRef.current) {
      return;
    }

    // Get the proper document and window
    const { win } = getDocumentAndWindow();

    const inputRect = inputRef.current.getBoundingClientRect();
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
  }, [containerRef, inputRef]);

  // Handle window resize to reposition the calendar
  useEffect(() => {
    if (!isOpen) {
      return;
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

  // Toggle popup visibility.
  const togglePicker = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setIsOpen((prev) => !prev);
      if (!isOpen && onFocus) {
        onFocus(id, value);
      }

      // Position calculation will happen in the effect hook
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

  // Close popup on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        if (onBlur) {
          onBlur(id, value);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
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
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            togglePicker(e as unknown as React.MouseEvent);
          }
        }}
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
            {localDate && isValid(localDate) ? format(localDate, 'PP') : schema.title}
          </span>
          <FontAwesomeIcon icon={faCalendar} className='ml-2 h-4 w-4 text-primary' />
        </div>
        {isOpen && (
          <div
            ref={containerRef}
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
