import { useCallback, useMemo } from 'react';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, WidgetProps } from '@rjsf/utils';
import { isNamedByTemplateLabel } from '@rjsf/utils';
import { format, startOfDay } from 'date-fns';

import DatePickerCalendar from '../DatePickerCalendar.tsx';
import { useDateFormatter, useDatePicker, useDateReader } from '../datePickerHooks.ts';
import DatePickerTrigger, { DatePickerPopup, getDatePickerName } from '../DatePickerTrigger.tsx';

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
  const { id, value, presentation, placeholder, options, disabled, readonly, required, autofocus, schema, registry } =
    props;
  const named = isNamedByTemplateLabel<T, S, F>(props);
  const pickerName = getDatePickerName<T, S, F>(props);
  const readDate = useDateReader<S>(schema, 'date');
  const initialDate = useMemo(() => readDate(value), [readDate, value]);
  const formatDate = useDateFormatter<S>(schema, 'date');
  const {
    isOpen,
    popupId,
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

  const formattedValue = displayedDate ? format(displayedDate, 'PP') : undefined;

  return (
    <div className='form-control w-full relative'>
      <div className='w-full'>
        <DatePickerTrigger
          id={id}
          fallbackName={pickerName}
          named={named}
          presentation={presentation}
          placeholder={placeholder}
          formattedValue={formattedValue}
          isOpen={isOpen}
          popupId={popupId}
          disabled={disabled}
          readonly={readonly}
          required={required}
          autofocus={autofocus}
          triggerRef={triggerRef}
          onClick={togglePicker}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {isOpen && (
          <DatePickerPopup
            id={popupId}
            name={pickerName}
            containerRef={containerRef}
            translateString={registry.translateString}
            onDone={handleDone}
          >
            <div className='p-3' style={{ minHeight: 350 }}>
              <DatePickerCalendar
                selectedDate={displayedDate}
                month={month}
                onMonthChange={handleMonthChange}
                onSelect={handleSelect}
              />
            </div>
          </DatePickerPopup>
        )}
      </div>
    </div>
  );
}
