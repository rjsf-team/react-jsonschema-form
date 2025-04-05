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
} from '@rjsf/utils';

// Define the date object structure
interface DateObject {
  year?: string;
  month?: string;
  day?: string;
  hour?: string;
  minute?: string;
  second?: string;
}

// Check if the date has all required fields
function readyForChange(state: DateObject, time = false) {
  return state.year && state.month && state.day && (!time || (state.hour && state.minute && state.second));
}

// Helper type for date element format
type DateElementFormat = 'YMD' | 'MDY' | 'DMY';

// Get props for date elements based on format
function getDateElementProps(
  state: DateObject,
  time: boolean,
  yearsRange?: [number, number],
  format: DateElementFormat = 'YMD'
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
      { type: 'second', value: state.second, range: [0, 59] as [number, number] }
    );
  }

  return dateElements;
}

// Component for each date element (year, month, day, etc.)
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
}: {
  type: string;
  range: [number, number];
  value?: string;
  select: (property: keyof DateObject, value: any) => void;
  rootId: string;
  name: string;
  disabled?: boolean;
  readonly?: boolean;
  autofocus?: boolean;
  registry: any;
  onBlur: (id: string, value: string) => void;
  onFocus: (id: string, value: string) => void;
}) {
  const id = `${rootId}_${type}`;
  const { SelectWidget } = registry.widgets;

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
      onChange={(value: any) => select(type as keyof DateObject, value)}
      onBlur={onBlur}
      onFocus={onFocus}
      registry={registry}
      label=''
      aria-describedby={ariaDescribedByIds<T>(rootId)}
      required={false}
    />
  );
}

// Main AltDateWidget component
function AltDateWidget<T = any, S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = any>({
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
    const stateValue = toDateString(state, time);
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
      onChange(toDateString(nextState, time));
    },
    [disabled, readonly, time, onChange]
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
    [disabled, readonly, onChange]
  );

  return (
    <div className='space-y-3'>
      <div className='grid grid-cols-3 gap-2'>
        {getDateElementProps(
          state,
          time,
          options.yearsRange as [number, number] | undefined,
          options.format as DateElementFormat | undefined
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

export default AltDateWidget;
