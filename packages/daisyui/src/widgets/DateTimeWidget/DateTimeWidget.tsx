import type { ChangeEvent } from 'react';
import { memo, useCallback, useMemo } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { getDateTimeLocalValue } from '@rjsf/utils';
import { format, isValid } from 'date-fns';

import DatePickerCalendar from '../DatePickerCalendar.tsx';
import type { DatePickerCalendarProps } from '../DatePickerCalendar.tsx';
import { readDateOnly, readInstant, useDateFormatter, useDatePicker } from '../datePickerHooks.ts';
import DatePickerTrigger from '../DatePickerTrigger.tsx';

/** Props for the DateTimePicker popup component, which is the calendar's own plus the time input's
 */
interface DateTimePickerProps extends DatePickerCalendarProps {
  /** The id of the time input, which its own label names */
  id: string;
  /** Handler for time input changes */
  onTimeChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Popup component for the calendar and time input
 *
 * Renders a DayPicker calendar with time input for selecting date and time
 *
 * @param props - The DateTimePickerProps for this component
 */
function DateTimePickerPopup({ id, selectedDate, month, onMonthChange, onSelect, onTimeChange }: DateTimePickerProps) {
  return (
    <div className='p-3'>
      <DatePickerCalendar selectedDate={selectedDate} month={month} onMonthChange={onMonthChange} onSelect={onSelect} />

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
  //
  // `getDateTimeLocalValue()` returns text as it was stored, and `undefined` for a value the picker cannot read. An
  // epoch number or `Date` a consumer left in the form data is an exact instant, so it is read as one rather than from
  // its wall-clock text, which cannot tell apart the two 01:30s on the night clocks go back. A `format: 'date'` value
  // that is a UTC midnight is the exception: `localValue` names the day it stands for.
  const initialDate = useMemo(() => {
    if (localValue === undefined) {
      return undefined;
    }
    return readDateOnly(localValue) ?? readInstant(typeof value === 'string' ? localValue : value);
  }, [localValue, value]);
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

  // Take the day the user picked, keeping the time the popup already holds.
  const handleSelect = useCallback(
    (date: Date | undefined) => {
      if (date) {
        // A copy, since react-day-picker memoizes the `Date` it hands over for as long as the month stays displayed:
        // setting the time on that instance would leave the day cell carrying the time this field holds
        const picked = new Date(date);
        if (displayedDate) {
          // Down to the milliseconds, which the time input cannot show: the user picked a day, not a time, and a
          // stored value may carry seconds this widget has no way to put back
          picked.setHours(
            displayedDate.getHours(),
            displayedDate.getMinutes(),
            displayedDate.getSeconds(),
            displayedDate.getMilliseconds(),
          );
        }
        chooseDate(picked);
      }
    },
    [chooseDate, displayedDate],
  );

  // Take the time the user typed, on the day the popup already holds.
  const handleTimeChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (displayedDate) {
        const [hours, minutes] = e.target.value.split(':');
        const newDate = new Date(displayedDate);
        newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
        // An emptied or half-typed time parses as `NaN`, which invalidates the whole date. The last valid one is kept
        // instead, so the input re-renders the time it still holds and the user can carry on editing it; an
        // `Invalid Date` in this state throws from the calendar's month caption before it can be corrected
        if (isValid(newDate)) {
          chooseDate(newDate);
        }
      }
    },
    [chooseDate, displayedDate],
  );

  // Prevent event propagation for popup container
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const formattedValue = displayedDate ? format(displayedDate, 'PP p') : undefined;

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
              selectedDate={displayedDate}
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
