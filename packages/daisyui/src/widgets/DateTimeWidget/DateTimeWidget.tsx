import type { ChangeEvent } from 'react';
import { memo, useCallback, useMemo } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getDateTimeLocalValue } from '@rjsf/utils';
import { format, isSameDay, isToday, isValid } from 'date-fns';
import type { ClassNames, ModifiersClassNames } from 'react-day-picker';
import { DayPicker, UI } from 'react-day-picker';

import { readDateOnly, useDateFormatter, useDatePicker } from '../datePickerHooks.ts';
import DatePickerTrigger from '../DatePickerTrigger.tsx';
import 'react-day-picker/dist/style.css';

/**
 * Props for the DateTimePicker popup component
 */
interface DateTimePickerProps {
  /** DayTimePicker id */
  id: string;
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
function DateTimePickerPopup({ id, selectedDate, month, onMonthChange, onSelect, onTimeChange }: DateTimePickerProps) {
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
        startMonth={new Date(1900, 0)}
        endMonth={new Date(new Date().getFullYear() + 10, 11)}
        showOutsideDays
        classNames={dayPickerStyles.classNames}
        modifiers={customDayModifiers}
        modifiersClassNames={customModifiersClassNames}
      />

      <div className='mt-3 border-t border-base-300 pt-3'>
        <div className='form-control w-full'>
          <label htmlFor={id} className='label'>
            <span className='label-text'>Time</span>
          </label>
          <input
            id={id}
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
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: WidgetProps<T, S, F>) {
  const { id, value, label, name, hideLabel, placeholder, options, disabled, readonly, schema, registry } = props;
  const { localValue } = getDateTimeLocalValue(schema, value);
  const formatDate = useDateFormatter<S>(schema, 'date-time');
  // Initialize the local date from the parent's value. For `iso-date-time`, a stored value that happens to
  // carry an offset is stripped first, so it's parsed as the naive wall-clock time it represents instead of
  // being converted to the browser's local zone. An unparsable stored value (e.g. left over from a schema
  // change) normalizes to `undefined` here, rather than becoming an `Invalid Date` that every downstream
  // consumer (the calendar's month caption, the time input, the commit) would otherwise have to guard
  // against individually.
  const initialDate = useMemo(() => {
    if (!localValue) {
      return undefined;
    }
    const date = readDateOnly(localValue) ?? new Date(localValue);
    return isValid(date) ? date : undefined;
  }, [localValue]);
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

  // Take the day the user picked, keeping the time the popup already holds.
  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        if (localDate) {
          // Down to the milliseconds, which the time input cannot show: the user picked a day, not a time, and a
          // stored value may carry seconds this widget has no way to put back
          date.setHours(
            localDate.getHours(),
            localDate.getMinutes(),
            localDate.getSeconds(),
            localDate.getMilliseconds(),
          );
        }
        chooseDate(date);
      }
    },
    [chooseDate, localDate],
  );

  // Take the time the user typed, on the day the popup already holds.
  const handleTimeChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (localDate) {
        const [hours, minutes] = e.target.value.split(':');
        const newDate = new Date(localDate);
        newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
        // An emptied or half-typed time parses as `NaN`, which invalidates the whole date. The last valid one is kept
        // instead, so the input re-renders the time it still holds and the user can carry on editing it; an
        // `Invalid Date` in this state throws from the calendar's month caption before it can be corrected
        if (isValid(newDate)) {
          chooseDate(newDate);
        }
      }
    },
    [chooseDate, localDate],
  );

  // Prevent event propagation for popup container
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const formattedValue = localDate ? format(localDate, 'PP p') : undefined;

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
            role='presentation'
            ref={containerRef}
            className='absolute z-[100] mt-2 w-full max-w-xs bg-base-100 border border-base-300 shadow-lg rounded-box'
            onClick={handleContainerClick}
          >
            <MemoizedDateTimePickerPopup
              id={`${id}-picker`}
              selectedDate={localDate}
              month={month}
              onMonthChange={handleMonthChange}
              onSelect={handleSelect}
              onTimeChange={handleTimeChange}
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
