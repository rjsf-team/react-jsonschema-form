import { ChangeEvent, MouseEvent } from 'react';
import { fireEvent, render, renderHook } from '@testing-library/react';

import {
  DateElement,
  DateElementProp,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  getDateElementProps,
  parseDateString,
  Registry,
  useAltDateWidgetProps,
  UseAltDateWidgetResult,
  WidgetProps,
} from '../src';

function SelectWidget({ id, options, value, required, disabled, readonly, onChange }: WidgetProps) {
  const { enumOptions } = options;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newValue = (event.target as HTMLSelectElement).value;
    return onChange(enumOptionsValueForIndex(newValue, enumOptions));
  };

  const selectedIndexes = enumOptionsIndexForValue(value, enumOptions);

  return (
    <select
      id={id}
      role='combobox'
      value={typeof selectedIndexes === 'undefined' ? '' : selectedIndexes}
      required={required}
      disabled={disabled || readonly}
      onChange={handleChange}
    >
      {Array.isArray(enumOptions) &&
        enumOptions.map(({ label }, i) => {
          return (
            <option key={i} value={String(i)}>
              {label}
            </option>
          );
        })}
    </select>
  );
}

function DateElementsTester(
  props: WidgetProps & { elements: DateElementProp[]; handleChange: UseAltDateWidgetResult['handleChange'] },
) {
  const { elements, handleChange, id, name, disabled, readonly, registry, onBlur, onFocus, autofocus } = props;
  return (
    <>
      {elements.map((elemProps, i) => (
        <DateElement
          key={i}
          rootId={id}
          name={name}
          select={handleChange}
          {...elemProps}
          disabled={disabled}
          readonly={readonly}
          registry={registry}
          onBlur={onBlur}
          onFocus={onFocus}
          autofocus={autofocus && i === 0}
        />
      ))}
    </>
  );
}

const DATE_TIME_STR = '2023-10-27T10:00:00.000Z';
const DATE_STR = '2023-10-27';
const MOCKED_DATE = new Date(DATE_TIME_STR);
const REGISTRY = {
  widgets: { SelectWidget },
} as unknown as Registry;
const PROPS: WidgetProps = {
  id: 'root',
  name: 'root',
  label: '',
  schema: { type: 'string', format: 'date-time' },
  registry: REGISTRY,
  options: { yearsRange: [2000, 2030] },
  onChange: jest.fn(),
  onBlur: jest.fn(),
  onFocus: jest.fn(),
  value: undefined,
};
const TIME_PROPS = {
  ...PROPS,
  time: true,
};

describe('useAltDateWidgetProps()', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(MOCKED_DATE);
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.mocked(PROPS.onChange).mockClear();
  });
  test('time is false, value undefined', () => {
    const { result } = renderHook(() => useAltDateWidgetProps(PROPS));
    const { elements, handleChange, handleClear, handleSetNow } = result.current;
    const dateObj = parseDateString();
    const expectedElements = getDateElementProps(dateObj, false, PROPS.options.yearsRange);
    expect(elements).toEqual(expectedElements);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleClear).toBeInstanceOf(Function);
    expect(handleSetNow).toBeInstanceOf(Function);
    // Simulate clicking the setNow button
    const simulatedEvent = {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent;
    handleSetNow(simulatedEvent);
    // onChange was called with the date for NOW
    expect(PROPS.onChange).toHaveBeenCalledWith(DATE_STR);
    expect(simulatedEvent.preventDefault).toHaveBeenCalled();
  });
  test('time is false, value DATE_STR', () => {
    const props = { ...PROPS, value: DATE_STR };
    const { result } = renderHook(() => useAltDateWidgetProps(props));
    const { elements, handleChange, handleClear, handleSetNow } = result.current;
    const dateObj = parseDateString(DATE_STR);
    const expectedElements = getDateElementProps(dateObj, false, PROPS.options.yearsRange);
    expect(elements).toEqual(expectedElements);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleClear).toBeInstanceOf(Function);
    expect(handleSetNow).toBeInstanceOf(Function);
    // Simulate clicking the setNow button
    const simulatedEvent = {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent;
    handleClear(simulatedEvent);
    // onChange was called with the date cleared
    expect(PROPS.onChange).toHaveBeenCalledWith(undefined);
    expect(simulatedEvent.preventDefault).toHaveBeenCalled();
  });
  test('time is false, value undefined, testing DateElements', () => {
    const { result, rerender: rerenderHook } = renderHook(() => useAltDateWidgetProps(PROPS));
    const { elements, handleChange, handleClear, handleSetNow } = result.current;
    const dateObj = parseDateString();
    let expectedElements = getDateElementProps(dateObj, false, PROPS.options.yearsRange);
    expect(elements).toEqual(expectedElements);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleClear).toBeInstanceOf(Function);
    expect(handleSetNow).toBeInstanceOf(Function);

    const { container, rerender } = render(
      <DateElementsTester elements={elements} handleChange={handleChange} {...PROPS} />,
    );
    fireEvent.change(container.querySelector('#root_year')!, {
      target: { value: 2023 - 2000 }, // convert year to index
    });
    expect(PROPS.onChange).not.toHaveBeenCalled();
    rerenderHook(() => useAltDateWidgetProps(PROPS));
    dateObj.year = 2023;
    expectedElements = getDateElementProps(dateObj, false, PROPS.options.yearsRange);
    expect(result.current.elements).toEqual(expectedElements);
    rerender(
      <DateElementsTester elements={result.current.elements} handleChange={result.current.handleChange} {...PROPS} />,
    );
    fireEvent.change(container.querySelector('#root_month')!, {
      target: { value: 9 }, // Month index
    });
    expect(PROPS.onChange).not.toHaveBeenCalled();
    rerenderHook(() => useAltDateWidgetProps(PROPS));
    dateObj.month = 10;
    expectedElements = getDateElementProps(dateObj, false, PROPS.options.yearsRange);
    expect(result.current.elements).toEqual(expectedElements);
    rerender(
      <DateElementsTester elements={result.current.elements} handleChange={result.current.handleChange} {...PROPS} />,
    );
    fireEvent.change(container.querySelector('#root_day')!, {
      target: { value: 1 }, // Day index
    });
    expect(PROPS.onChange).toHaveBeenCalledWith('2023-10-02');
  });
  test('time is true, value undefined', () => {
    const { result } = renderHook(() => useAltDateWidgetProps(TIME_PROPS));
    const { elements, handleChange, handleClear, handleSetNow } = result.current;
    const dateObj = parseDateString();
    const expectedElements = getDateElementProps(dateObj, true, TIME_PROPS.options.yearsRange);
    expect(elements).toEqual(expectedElements);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleClear).toBeInstanceOf(Function);
    expect(handleSetNow).toBeInstanceOf(Function);
    // Simulate clicking the setNow button
    const simulatedEvent = {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent;
    handleSetNow(simulatedEvent);
    // onChange was called with the date for NOW
    expect(TIME_PROPS.onChange).toHaveBeenCalledWith(DATE_TIME_STR);
    expect(simulatedEvent.preventDefault).toHaveBeenCalled();
  });
  test('time is true, value DATE_TIME_STR', () => {
    const props = { ...TIME_PROPS, value: DATE_TIME_STR };
    const { result } = renderHook(() => useAltDateWidgetProps(props));
    const { elements, handleChange, handleClear, handleSetNow } = result.current;
    const dateObj = parseDateString(DATE_TIME_STR);
    const expectedElements = getDateElementProps(dateObj, true, TIME_PROPS.options.yearsRange);
    expect(elements).toEqual(expectedElements);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleClear).toBeInstanceOf(Function);
    expect(handleSetNow).toBeInstanceOf(Function);
    // Simulate clicking the setNow button
    const simulatedEvent = {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent;
    handleClear(simulatedEvent);
    // onChange was called with the date cleared
    expect(TIME_PROPS.onChange).toHaveBeenCalledWith(undefined);
    expect(simulatedEvent.preventDefault).toHaveBeenCalled();
  });
  test('time is true, value undefined, testing DateElements', () => {
    const { result, rerender: rerenderHook } = renderHook(() => useAltDateWidgetProps(TIME_PROPS));
    const { elements, handleChange, handleClear, handleSetNow } = result.current;
    const dateObj = parseDateString();
    let expectedElements = getDateElementProps(dateObj, true, TIME_PROPS.options.yearsRange);
    expect(elements).toEqual(expectedElements);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleClear).toBeInstanceOf(Function);
    expect(handleSetNow).toBeInstanceOf(Function);

    const { container, rerender } = render(
      <DateElementsTester elements={elements} handleChange={handleChange} {...TIME_PROPS} />,
    );
    fireEvent.change(container.querySelector('#root_year')!, {
      target: { value: 2023 - 2000 }, // convert year to index
    });
    expect(TIME_PROPS.onChange).not.toHaveBeenCalled();
    rerenderHook(() => useAltDateWidgetProps(TIME_PROPS));
    dateObj.year = 2023;
    expectedElements = getDateElementProps(dateObj, true, TIME_PROPS.options.yearsRange);
    expect(result.current.elements).toEqual(expectedElements);
    rerender(
      <DateElementsTester
        elements={result.current.elements}
        handleChange={result.current.handleChange}
        {...TIME_PROPS}
      />,
    );
    fireEvent.change(container.querySelector('#root_month')!, {
      target: { value: 9 }, // Month index
    });
    expect(TIME_PROPS.onChange).not.toHaveBeenCalled();
    rerenderHook(() => useAltDateWidgetProps(TIME_PROPS));
    dateObj.month = 10;
    expectedElements = getDateElementProps(dateObj, true, TIME_PROPS.options.yearsRange);
    expect(result.current.elements).toEqual(expectedElements);
    rerender(
      <DateElementsTester
        elements={result.current.elements}
        handleChange={result.current.handleChange}
        {...TIME_PROPS}
      />,
    );
    fireEvent.change(container.querySelector('#root_day')!, {
      target: { value: 1 }, // Day index
    });
    expect(TIME_PROPS.onChange).not.toHaveBeenCalled();
    rerenderHook(() => useAltDateWidgetProps(TIME_PROPS));
    dateObj.day = 2;
    expectedElements = getDateElementProps(dateObj, true, TIME_PROPS.options.yearsRange);
    expect(result.current.elements).toEqual(expectedElements);
    rerender(
      <DateElementsTester
        elements={result.current.elements}
        handleChange={result.current.handleChange}
        {...TIME_PROPS}
      />,
    );
    fireEvent.change(container.querySelector('#root_hour')!, {
      target: { value: 1 },
    });
    expect(TIME_PROPS.onChange).not.toHaveBeenCalled();
    rerenderHook(() => useAltDateWidgetProps(TIME_PROPS));
    dateObj.hour = 1;
    expectedElements = getDateElementProps(dateObj, true, TIME_PROPS.options.yearsRange);
    expect(result.current.elements).toEqual(expectedElements);
    rerender(
      <DateElementsTester
        elements={result.current.elements}
        handleChange={result.current.handleChange}
        {...TIME_PROPS}
      />,
    );
    fireEvent.change(container.querySelector('#root_minute')!, {
      target: { value: 2 },
    });
    rerenderHook(() => useAltDateWidgetProps(TIME_PROPS));
    dateObj.minute = 2;
    expectedElements = getDateElementProps(dateObj, true, TIME_PROPS.options.yearsRange);
    expect(result.current.elements).toEqual(expectedElements);
    rerender(
      <DateElementsTester
        elements={result.current.elements}
        handleChange={result.current.handleChange}
        {...TIME_PROPS}
      />,
    );
    fireEvent.change(container.querySelector('#root_second')!, {
      target: { value: 3 },
    });
    expect(TIME_PROPS.onChange).toHaveBeenCalledWith('2023-10-02T01:02:03.000Z');
  });
  test('time is false, value DATE_STR, disabled', () => {
    const props = { ...PROPS, value: DATE_STR, disabled: true };
    const { result } = renderHook(() => useAltDateWidgetProps(props));
    const { elements, handleChange, handleClear, handleSetNow } = result.current;
    const dateObj = parseDateString(DATE_STR);
    const expectedElements = getDateElementProps(dateObj, false, PROPS.options.yearsRange);
    expect(elements).toEqual(expectedElements);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleClear).toBeInstanceOf(Function);
    expect(handleSetNow).toBeInstanceOf(Function);
    // Simulate clicking the setNow button
    const simulatedEvent = {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent;
    handleClear(simulatedEvent);
    expect(simulatedEvent.preventDefault).toHaveBeenCalledTimes(1);
    handleSetNow(simulatedEvent);
    expect(simulatedEvent.preventDefault).toHaveBeenCalledTimes(2);
    // onChange was not called due to disabled
    expect(PROPS.onChange).not.toHaveBeenCalled();
  });
  test('time is false, value undefined, readonly', () => {
    const props = { ...PROPS, readonly: true };
    const { result } = renderHook(() => useAltDateWidgetProps(props));
    const { elements, handleChange, handleClear, handleSetNow } = result.current;
    const dateObj = parseDateString();
    const expectedElements = getDateElementProps(dateObj, false, PROPS.options.yearsRange);
    expect(elements).toEqual(expectedElements);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleClear).toBeInstanceOf(Function);
    expect(handleSetNow).toBeInstanceOf(Function);
    // Simulate clicking the setNow button
    const simulatedEvent = {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent;
    handleClear(simulatedEvent);
    expect(simulatedEvent.preventDefault).toHaveBeenCalledTimes(1);
    handleSetNow(simulatedEvent);
    expect(simulatedEvent.preventDefault).toHaveBeenCalledTimes(2);
    // Corner case, pass undefined for the value to `handleChange()`
    handleChange('year', undefined);
    // onChange was not called due to disabled
    expect(PROPS.onChange).not.toHaveBeenCalled();
  });
});
