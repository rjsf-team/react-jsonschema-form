import { MouseEvent, useCallback, useEffect, useReducer, useState } from 'react';
import {
  ariaDescribedByIds,
  FormContextType,
  RJSFSchema,
  StrictRJSFSchema,
  WidgetProps,
  TranslatableString,
  parseDateString,
  toDateString,
  dateRangeOptions,
  DateObject as RJSFDateObject,
  Registry,
} from '@rjsf/utils';

/** Interface for date object with optional string fields for each date/time component */
interface DateObject {
  year?: string;
  month?: string;
  day?: string;
  hour?: string;
  minute?: string;
  second?: string;
}

/** Determines if the date object has all required fields to form a valid date
 *
 * @param state - The date object to check
 * @param time - Whether to check time fields as well
 * @returns True if all required fields are present
 */
function readyForChange(state: DateObject, time = false) {
  return state.year && state.month && state.day && (!time || (state.hour && state.minute && state.second));
}

/** Supported date element display formats */
type DateElementFormat = 'YMD' | 'MDY' | 'DMY';

/** Gets configuration for date elements based on format and ranges
 *
 * @param state - The current date object state
 * @param time - Whether to include time elements
 * @param yearsRange - Optional range of years to display
 * @param format - Format for ordering date elements (year, month, day)
 * @returns Array of element properties for rendering
 */
function getDateElementProps(
  state: DateObject,
  time: boolean,
  yearsRange?: [number, number],
  format: DateElementFormat = 'YMD',
) {
  const rangeOptions = yearsRange ?? [1900, new Date().getFullYear() + 2];
  // Define the order based on the format
  const formats: Record<DateElementFormat, Array<keyof DateObject>> = {
    YMD: ['year', 'month', 'day'],
    MDY: ['month', 'day', 'year'],
    DMY: ['day', 'month', 'year'],
  };

  // Get the elements in the specified order
  const dateElements = formats[format].map((key) => ({
    type: key,
    value: state[key],
    range:
      key === 'year'
        ? (rangeOptions as [number, number])
        : key === 'month'
          ? ([1, 12] as [number, number])
          : key === 'day'
            ? ([1, 31] as [number, number])
            : ([0, 59] as [number, number]),
  }));

  // Add time elements if needed
  if (time) {
    dateElements.push(
      { type: 'hour', value: state.hour, range: [0, 23] as [number, number] },
      { type: 'minute', value: state.minute, range: [0, 59] as [number, number] },
      { type: 'second', value: state.second, range: [0, 59] as [number, number] },
    );
  }

  return dateElements;
}

/** Props for the DateElement component */
interface DateElementProps<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any> {
  /** Type of date element (year, month, day, etc.) */
  type: string;
  /** Min/max range for the element values */
  range: [number, number];
  /** Current value */
  value?: string;
  /** Function to call when value is selected */
  select: (property: keyof DateObject, value: any) => void;
  /** Base ID for the form element */
  rootId: string;
  /** Name attribute for the form element */
  name: string;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether the input is readonly */
  readonly?: boolean;
  /** Whether the input should autofocus */
  autofocus?: boolean;
  /** Registry containing widgets and templates */
  registry: Registry<T, S, F>;
  /** Function called when input loses focus */
  onBlur: (id: string, value: string) => void;
  /** Function called when input gains focus */
  onFocus: (id: string, value: string) => void;
}

/** Component for rendering individual date/time elements (year, month, day, etc.)
 *
 * Renders a select input for each date component with appropriate options.
 *
 * @param props - The props for the component
 */
function DateElement<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
  type,
  range,
  value,
  select,
  rootId,
  name,
  disabled,
  readonly,
  autofocus,
  registry,
  onBlur,
  onFocus,
}: DateElementProps<T, S, F>) {
  const id = `${rootId}_${type}`;
  const { SelectWidget } = registry.widgets as Registry<T, S, F>['widgets'];

  // Memoize the onChange handler
  const handleChange = useCallback(
    (value: any) => {
      select(type as keyof DateObject, value);
    },
    [select, type],
  );

  return (
    <SelectWidget
      schema={{ type: 'integer' } as S}
      id={id}
      name={name}
      className='select select-bordered select-sm w-full'
      options={{ enumOptions: dateRangeOptions<S>(range[0], range[1]) }}
      placeholder={type}
      value={value}
      disabled={disabled}
      readonly={readonly}
      autofocus={autofocus}
      onChange={handleChange}
      onBlur={onBlur}
      onFocus={onFocus}
      registry={registry}
      label=''
      aria-describedby={ariaDescribedByIds<T>(rootId)}
      required={false}
    />
  );
}

/** Converts our DateObject to the expected format for toDateString
 *
 * @param dateObj - The internal DateObject
 * @returns A properly formatted object for the utils toDateString function
 */
function convertToRJSFDateObject(dateObj: DateObject): RJSFDateObject {
  return {
    year: dateObj.year ? parseInt(dateObj.year) : 0,
    month: dateObj.month ? parseInt(dateObj.month) : 0,
    day: dateObj.day ? parseInt(dateObj.day) : 0,
    hour: dateObj.hour ? parseInt(dateObj.hour) : 0,
    minute: dateObj.minute ? parseInt(dateObj.minute) : 0,
    second: dateObj.second ? parseInt(dateObj.second) : 0,
  };
}

/** The `AltDateWidget` component provides an alternative date/time input
 * with individual fields for year, month, day, and optionally time components.
 *
 * Features:
 * - Supports different date formats (YMD, MDY, DMY)
 * - Optional time selection (hours, minutes, seconds)
 * - "Set to now" and "Clear" buttons
 * - Configurable year ranges
 * - Accessible controls with proper labeling
 * - DaisyUI styling for all elements
 *
 * @param props - The `WidgetProps` for this component
 */
export default function AltDateWidget<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>({
  time = false,
  disabled = false,
  readonly = false,
  autofocus = false,
  options = {},
  id,
  name,
  registry,
  onBlur,
  onFocus,
  onChange,
  value,
}: WidgetProps<T, S, F>) {
  const { translateString } = registry;
  const [lastValue, setLastValue] = useState(value);

  // Use a type-safe version of parseDateString result
  const initialState = parseDateString(value, time) as unknown as DateObject;

  // Create a reducer for date objects
  const dateReducer = (state: DateObject, action: Partial<DateObject>): DateObject => {
    return { ...state, ...action };
  };

  const [state, setState] = useReducer(dateReducer, initialState);

  // Handle changes in props or state
  useEffect(() => {
    const rjsfDateObj = convertToRJSFDateObject(state);
    const stateValue = toDateString(rjsfDateObj, time);
    if (readyForChange(state, time) && stateValue !== value) {
      // Valid date changed via the selects
      onChange(stateValue);
    } else if (lastValue !== value) {
      // New value from props
      setLastValue(value);
      setState(parseDateString(value, time) as unknown as DateObject);
    }
  }, [time, value, onChange, state, lastValue]);

  // Handle individual field changes
  const handleChange = useCallback((property: keyof DateObject, value: string) => {
    setState({ [property]: value });
  }, []);

  // Set current date
  const handleSetNow = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (disabled || readonly) {
        return;
      }
      const nextState = parseDateString(new Date().toJSON(), time) as unknown as DateObject;
      const rjsfDateObj = convertToRJSFDateObject(nextState);
      onChange(toDateString(rjsfDateObj, time));
    },
    [disabled, readonly, time, onChange],
  );

  // Clear the date
  const handleClear = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      if (disabled || readonly) {
        return;
      }
      onChange(undefined);
    },
    [disabled, readonly, onChange],
  );

  return (
    <div className='space-y-3'>
      <div className='grid grid-cols-3 gap-2'>
        {getDateElementProps(
          state,
          time,
          options.yearsRange as [number, number] | undefined,
          options.format as DateElementFormat | undefined,
        ).map((elemProps, i) => (
          <div key={i} className='form-control'>
            <label className='label'>
              <span className='label-text capitalize'>{elemProps.type}</span>
            </label>
            <DateElement
              rootId={id}
              name={name}
              select={handleChange}
              type={elemProps.type}
              range={elemProps.range}
              value={elemProps.value}
              disabled={disabled}
              readonly={readonly}
              registry={registry}
              onBlur={onBlur}
              onFocus={onFocus}
              autofocus={autofocus && i === 0}
            />
          </div>
        ))}
      </div>
      <div className='flex justify-start space-x-2'>
        {(options.hideNowButton !== undefined ? !options.hideNowButton : true) && (
          <button
            type='button'
            className='btn btn-sm btn-primary'
            onClick={handleSetNow}
            disabled={disabled || readonly}
          >
            {translateString(TranslatableString.NowLabel)}
          </button>
        )}
        {(options.hideClearButton !== undefined ? !options.hideClearButton : true) && (
          <button
            type='button'
            className='btn btn-sm btn-secondary'
            onClick={handleClear}
            disabled={disabled || readonly}
          >
            {translateString(TranslatableString.ClearLabel)}
          </button>
        )}
      </div>
    </div>
  );
}
