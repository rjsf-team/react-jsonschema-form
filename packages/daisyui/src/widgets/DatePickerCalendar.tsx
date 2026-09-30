import { isSameDay, isToday } from 'date-fns';
import type { ClassNames, ModifiersClassNames } from 'react-day-picker';
import { DayPicker, UI } from 'react-day-picker';

import 'react-day-picker/dist/style.css';

/** DayPicker's own elements, painted with DaisyUI classes. Shared so the two pickers cannot drift into two calendars
 * that look alike but not the same
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

const modifiersClassNames: ModifiersClassNames = {
  ...dayPickerStyles.modifiers,
  'custom-today': 'btn btn-outline btn-info min-h-0 h-full',
};

interface DatePickerCalendarProps {
  /** The day the calendar marks as selected, `undefined` where it holds none */
  selectedDate?: Date;
  /** The month the calendar is displaying */
  month: Date;
  /** Reports a move to another month, which choosing no day in it still does */
  onMonthChange: (date: Date) => void;
  /** Reports the day the user chose */
  onSelect: (date: Date | undefined) => void;
}

/** The calendar both picker widgets render, which differ in what they put around it rather than in the grid itself.
 *
 * @param props - The day to mark and the month to show it in, with the handlers for choosing either
 */
export default function DatePickerCalendar({ selectedDate, month, onMonthChange, onSelect }: DatePickerCalendarProps) {
  const modifiers = {
    selected: selectedDate,
    'custom-today': (date: Date) => isToday(date) && !(selectedDate && isSameDay(date, selectedDate)),
  };

  return (
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
      modifiers={modifiers}
      modifiersClassNames={modifiersClassNames}
    />
  );
}
