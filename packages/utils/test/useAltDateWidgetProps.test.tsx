/** @vitest-environment jsdom */
import type { ChangeEvent, MouseEvent } from 'react';
import { useState } from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { userEvent } from '@testing-library/user-event';

import type { DateElementProp, Registry, UseAltDateWidgetResult, WidgetProps } from '../src/index.ts';
import {
  DateElement,
  englishStringTranslator,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  getDateElementProps,
  parseDateString,
  useAltDateWidgetProps,
} from '../src/index.ts';

function SelectWidget({
  id,
  options,
  value,
  required,
  disabled,
  readonly,
  placeholder,
  onChange,
  'aria-label': ariaLabel,
}: WidgetProps) {
  const { enumOptions } = options;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    return onChange(enumOptionsValueForIndex(newValue, enumOptions));
  };

  const selectedIndexes = enumOptionsIndexForValue(value, enumOptions);

  return (
    <select
      id={id}
      value={typeof selectedIndexes === 'undefined' ? '' : selectedIndexes}
      required={required}
      disabled={disabled || readonly}
      onChange={handleChange}
      aria-label={ariaLabel}
    >
      <option value=''>{placeholder}</option>
      {Array.isArray(enumOptions) &&
        enumOptions.map(({ label }, i) => (
          // oxlint-disable-next-line react/no-array-index-key
          <option key={i} value={String(i)}>
            {label}
          </option>
        ))}
    </select>
  );
}

function DateElementsTester(
  props: WidgetProps & { elements: DateElementProp[]; handleChange: UseAltDateWidgetResult['handleChange'] },
) {
  const {
    elements,
    handleChange,
    id,
    name,
    label,
    hideLabel,
    disabled,
    readonly,
    registry,
    onBlur,
    onFocus,
    autofocus,
  } = props;
  return (
    <>
      {elements.map((elemProps, i) => (
        <DateElement
          // oxlint-disable-next-line react/no-array-index-key
          key={i}
          rootId={id}
          name={name}
          label={label}
          hideLabel={hideLabel}
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

let user: UserEvent;

const DATE_TIME_STR = '2023-10-27T10:00:00.000Z';
const DATE_STR = '2023-10-27';
const MOCKED_DATE = new Date(DATE_TIME_STR);
const REGISTRY = {
  widgets: { SelectWidget },
  translateString: englishStringTranslator,
} as unknown as Registry;
const PROPS: WidgetProps = {
  id: 'root',
  name: 'root',
  label: '',
  schema: { type: 'string', format: 'date-time' },
  registry: REGISTRY,
  options: { yearsRange: [2000, 2030] },
  onChange: vi.fn(),
  onBlur: vi.fn(),
  onFocus: vi.fn(),
  value: undefined,
};
const TIME_PROPS = {
  ...PROPS,
  time: true,
};

describe('useAltDateWidgetProps()', () => {
  beforeEach(() => {
    // Only Date is faked. Faking the timer functions as well hangs every interaction: @testing-library/react's
    // asyncWrapper drains the microtask queue with a setTimeout(resolve, 0) after each user-event call and only
    // pumps the clock when a global `jest` exists, which Vitest doesn't define, so that timeout never fires.
    // The wait isn't user-event's own, which is why neither `advanceTimers` nor `delay: null` helps.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(MOCKED_DATE);
    user = userEvent.setup();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.mocked(PROPS.onChange).mockClear();
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
      preventDefault: vi.fn(),
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
      preventDefault: vi.fn(),
    } as unknown as MouseEvent;
    handleClear(simulatedEvent);
    // onChange was called with the date cleared
    expect(PROPS.onChange).toHaveBeenCalledWith(undefined);
    expect(simulatedEvent.preventDefault).toHaveBeenCalled();
  });
  test('discards a partial selection and re-parses when the value or time prop changes', () => {
    const { result, rerender } = renderHook((props: WidgetProps) => useAltDateWidgetProps(props), {
      initialProps: PROPS,
    });
    act(() => result.current.handleChange('year', '2020'));
    expect(PROPS.onChange).not.toHaveBeenCalled();
    expect(result.current.elements[0].value).toBe('2020');
    rerender({ ...PROPS, value: DATE_STR });
    expect(result.current.elements).toEqual(
      getDateElementProps(parseDateString(DATE_STR), false, PROPS.options.yearsRange),
    );
    rerender({ ...TIME_PROPS, value: DATE_STR });
    expect(result.current.elements).toEqual(
      getDateElementProps(parseDateString(DATE_STR, true), true, PROPS.options.yearsRange),
    );
  });
  test('discards a partial selection when the value changes and then changes back', () => {
    const { result, rerender } = renderHook((props: WidgetProps) => useAltDateWidgetProps(props), {
      initialProps: PROPS,
    });
    act(() => result.current.handleChange('year', '2020'));
    rerender({ ...PROPS, value: DATE_STR });
    rerender(PROPS);
    expect(result.current.elements).toEqual(getDateElementProps(parseDateString(), false, PROPS.options.yearsRange));
  });
  describe('with a parent that stores what it is sent', () => {
    const CLEAR_EVENT = { preventDefault: vi.fn() } as unknown as MouseEvent;
    const BLANK = getDateElementProps(parseDateString(), false, PROPS.options.yearsRange);

    function renderControlled() {
      return renderHook(() => {
        const [value, setValue] = useState<unknown>();
        return useAltDateWidgetProps({ ...PROPS, value, onChange: setValue });
      });
    }

    test('Clear after completing a date leaves the widget blank', () => {
      const { result } = renderControlled();
      act(() => result.current.handleChange('year', '2020'));
      act(() => result.current.handleChange('month', '5'));
      act(() => result.current.handleChange('day', '1'));
      act(() => result.current.handleClear(CLEAR_EVENT));
      expect(result.current.elements).toEqual(BLANK);
    });

    test('Clear during a partial selection leaves the widget blank', () => {
      const { result } = renderControlled();
      act(() => result.current.handleChange('year', '2020'));
      act(() => result.current.handleClear(CLEAR_EVENT));
      expect(result.current.elements).toEqual(BLANK);
    });
  });
  test('time is false, value undefined, testing DateElements', async () => {
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
    await user.selectOptions(container.querySelector('#root_year')!, String(2023 - 2000)); // convert year to index
    expect(PROPS.onChange).not.toHaveBeenCalled();
    rerenderHook(() => useAltDateWidgetProps(PROPS));
    dateObj.year = 2023;
    expectedElements = getDateElementProps(dateObj, false, PROPS.options.yearsRange);
    expect(result.current.elements).toEqual(expectedElements);
    rerender(
      <DateElementsTester elements={result.current.elements} handleChange={result.current.handleChange} {...PROPS} />,
    );
    await user.selectOptions(container.querySelector('#root_month')!, '9'); // Month index
    expect(PROPS.onChange).not.toHaveBeenCalled();
    rerenderHook(() => useAltDateWidgetProps(PROPS));
    dateObj.month = 10;
    expectedElements = getDateElementProps(dateObj, false, PROPS.options.yearsRange);
    expect(result.current.elements).toEqual(expectedElements);
    rerender(
      <DateElementsTester elements={result.current.elements} handleChange={result.current.handleChange} {...PROPS} />,
    );
    await user.selectOptions(container.querySelector('#root_day')!, '1'); // Day index
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
      preventDefault: vi.fn(),
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
      preventDefault: vi.fn(),
    } as unknown as MouseEvent;
    handleClear(simulatedEvent);
    // onChange was called with the date cleared
    expect(TIME_PROPS.onChange).toHaveBeenCalledWith(undefined);
    expect(simulatedEvent.preventDefault).toHaveBeenCalled();
  });
  test('time is true, value undefined, testing DateElements', async () => {
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
    await user.selectOptions(container.querySelector('#root_year')!, String(2023 - 2000)); // convert year to index
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
    await user.selectOptions(container.querySelector('#root_month')!, '9'); // Month index
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
    await user.selectOptions(container.querySelector('#root_day')!, '1'); // Day index
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
    await user.selectOptions(container.querySelector('#root_hour')!, '1');
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
    await user.selectOptions(container.querySelector('#root_minute')!, '2');
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
    await user.selectOptions(container.querySelector('#root_second')!, '3');
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
      preventDefault: vi.fn(),
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
      preventDefault: vi.fn(),
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
  describe('DateElement names', () => {
    const TIME_ELEMENTS = getDateElementProps(parseDateString(), true, PROPS.options.yearsRange);

    function renderElements(props: Partial<WidgetProps>, registry: Registry = REGISTRY) {
      return render(
        <DateElementsTester
          elements={TIME_ELEMENTS}
          handleChange={vi.fn()}
          {...TIME_PROPS}
          {...props}
          registry={registry}
        />,
      );
    }

    test('names each element by the field label and the element', () => {
      renderElements({ label: 'When' });
      ['year', 'month', 'day', 'hour', 'minute', 'second'].forEach((type) => {
        const select = screen.getByRole('combobox', { name: `When, ${type}` });
        expect(select).toHaveDisplayValue(type);
      });
    });

    test('names each element by the element alone when the label is empty or hidden', () => {
      const { unmount } = renderElements({ label: '' });
      expect(screen.getByRole('combobox', { name: 'year' })).toBeInTheDocument();
      unmount();
      renderElements({ label: 'When', hideLabel: true });
      expect(screen.getByRole('combobox', { name: 'year' })).toBeInTheDocument();
    });

    test('translates the name and the placeholder of each element', () => {
      const translateString = vi.fn((key: string) => `[${key}]`);
      renderElements({ label: 'When' }, { ...REGISTRY, translateString });
      const select = screen.getByRole('combobox', { name: 'When, [minute]' });
      expect(select).toHaveDisplayValue('[minute]');
    });
  });
});
