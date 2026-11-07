/** @vitest-environment jsdom */
import type { ChangeEvent, MouseEvent } from 'react';
import { useState } from 'react';
import { act, render, renderHook, screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { userEvent } from '@testing-library/user-event';

import { elementOf } from '../../../testing/elementOf.ts';
import type { DateElementProp, Registry, UseAltDateWidgetResult, WidgetProps } from '../src/index.ts';
import {
  ariaDescribedByIds,
  DateElement,
  englishStringTranslator,
  enumOptionsIndexForValue,
  enumOptionsValueForIndex,
  getDateElementProps,
  parseDateString,
  resolveFieldPresentation,
  useAltDateWidgetProps,
  widgetAriaProps,
} from '../src/index.ts';

function SelectWidget(props: WidgetProps) {
  const { id, options, value, required, disabled, readonly, placeholder, onChange, name } = props;
  const { enumOptions } = options;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newValue = event.target.value;
    return onChange(enumOptionsValueForIndex(newValue, enumOptions));
  };

  const selectedIndexes = enumOptionsIndexForValue(value, enumOptions);

  return (
    <select
      id={id}
      name={name}
      value={typeof selectedIndexes === 'undefined' ? '' : selectedIndexes}
      required={required}
      disabled={disabled || readonly}
      onChange={handleChange}
      {...widgetAriaProps(props)}
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
  const { elements, handleChange, id, label, disabled, readonly, registry, onBlur, onFocus, autofocus, presentation } =
    props;
  return (
    <>
      {elements.map((elemProps, i) => (
        <DateElement
          // oxlint-disable-next-line react/no-array-index-key
          key={i}
          rootId={id}
          label={label}
          select={handleChange}
          {...elemProps}
          disabled={disabled}
          readonly={readonly}
          registry={registry}
          onBlur={onBlur}
          onFocus={onFocus}
          autofocus={autofocus && i === 0}
          presentation={presentation}
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
const YEARS_RANGE: [number, number] = [2000, 2030];
const PROPS: WidgetProps = {
  id: 'root',
  name: 'root',
  label: '',
  schema: { type: 'string', format: 'date-time' },
  registry: REGISTRY,
  options: { yearsRange: YEARS_RANGE },
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
  test('reads the years of a `yearsRange` held as numeric strings', () => {
    const jsonOptions: Record<string, unknown> = { yearsRange: ['1990', '1992'] };
    const { result } = renderHook(() => useAltDateWidgetProps({ ...PROPS, options: jsonOptions }));

    const years = result.current.elements.find(({ type }) => type === 'year');
    expect(years?.range).toEqual([1990, 1992]);
  });
  test('rounds the years of a fractional `yearsRange` down', () => {
    const { result } = renderHook(() => useAltDateWidgetProps({ ...PROPS, options: { yearsRange: [1990.5, 1992.5] } }));

    expect(result.current.elements.find(({ type }) => type === 'year')?.range).toEqual([1990, 1992]);
  });
  test('keeps a `yearsRange` spanning more than a thousand years', () => {
    const { result } = renderHook(() => useAltDateWidgetProps({ ...PROPS, options: { yearsRange: [800, 2030] } }));

    expect(result.current.elements.find(({ type }) => type === 'year')?.range).toEqual([800, 2030]);
  });
  test.each([
    ['one entry', [1990]],
    ['null', [null, 2030]],
    ['NaN', [1990, Number.NaN]],
    ['a number', 2000],
    ['a boolean', true],
    ['an object', {}],
    ['an array-like object', { 0: 1990, 1: 2030 }],
    ['a relative and an absolute year', [-10, 2030]],
    ['an absolute and a relative year', [2030, -10]],
    ['a relative and an absolute year as numeric strings', ['-10', '2030']],
    ['a span of a billion years', [1, 1e9]],
    ['a span of a billion years as numeric strings', ['1', '1000000000']],
    ['years too large to count one by one', [1e16, 1e16]],
    ['years too large to count one by one as numeric strings', ['10000000000000000', '10000000000000000']],
    ['a relative span of a billion years', [-1e9, 0]],
    ['absolute years from 0, which the date string would write as 19xx', [0, 2]],
    ['a year past 9999, which the date string cannot hold', [2000, 300000]],
  ])('falls back to the default years for a `yearsRange` holding %s', (_, yearsRange) => {
    const jsonOptions: Record<string, unknown> = { yearsRange };
    const { result } = renderHook(() => useAltDateWidgetProps({ ...PROPS, options: jsonOptions }));

    const years = result.current.elements.find(({ type }) => type === 'year');
    expect(years?.range).toEqual(
      getDateElementProps(parseDateString(), false).find(({ type }) => type === 'year')?.range,
    );
  });
  test('clearing a part with no value leaves the date incomplete', () => {
    const { result } = renderHook(() => useAltDateWidgetProps({ ...PROPS, value: DATE_STR }));
    act(() => result.current.handleChange('month'));
    expect(PROPS.onChange).not.toHaveBeenCalled();
    expect(result.current.elements.find(({ type }) => type === 'month')?.value).toBeUndefined();
  });
  test.each([
    ['month', 'an empty string', ''],
    ['day', 'an empty string', ''],
    ['month', 'null', null],
    ['day', 'null', null],
    ['month', 'a string that is no number', 'abc'],
    ['day', 'a string that is no number', 'abc'],
    ['day', 'false', false],
    ['day', 'true', true],
    ['day', 'an empty array', []],
    ['day', 'a blank string', ' '],
    ['day', 'a hex string', '0x3'],
  ] as const)('clearing %s with %s leaves the date incomplete', (part, _name, cleared) => {
    const { result } = renderHook(() => useAltDateWidgetProps({ ...PROPS, value: DATE_STR }));
    act(() => result.current.handleChange(part, cleared));
    expect(PROPS.onChange).not.toHaveBeenCalled();
    const expectedDate = { ...parseDateString(DATE_STR), [part]: -1 };
    expect(result.current.elements).toEqual(getDateElementProps(expectedDate, false, YEARS_RANGE));
    expect(result.current.elements.find(({ type }) => type === part)?.value).toBeUndefined();
    act(() => result.current.handleChange(part, part === 'month' ? '11' : '28'));
    expect(PROPS.onChange).toHaveBeenCalledExactlyOnceWith(part === 'month' ? '2023-11-27' : '2023-10-28');
  });

  test.each([
    ['orders the elements by a date `format`', 'DMY', ['day', 'month', 'year']],
    ['keeps the default order for a `format` that is no date order', 'hex', ['year', 'month', 'day']],
  ])('%s, with the default years range', (_, format, order) => {
    const jsonOptions: Record<string, unknown> = { format };
    const { result } = renderHook(() => useAltDateWidgetProps({ ...PROPS, options: jsonOptions }));
    expect(result.current.elements.map(({ type }) => type)).toEqual(order);
    expect(result.current.elements.find(({ type }) => type === 'year')?.range).toEqual(
      getDateElementProps(parseDateString(undefined), false).find(({ type }) => type === 'year')?.range,
    );
  });

  test('time is false, value undefined', () => {
    const { result } = renderHook(() => useAltDateWidgetProps(PROPS));
    const { elements, handleChange, handleClear, handleSetNow } = result.current;
    const dateObj = parseDateString();
    const expectedElements = getDateElementProps(dateObj, false, YEARS_RANGE);
    expect(elements).toEqual(expectedElements);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleClear).toBeInstanceOf(Function);
    expect(handleSetNow).toBeInstanceOf(Function);
    expect(result.current.buttonsDisabled).toBe(false);
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
    const expectedElements = getDateElementProps(dateObj, false, YEARS_RANGE);
    expect(elements).toEqual(expectedElements);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleClear).toBeInstanceOf(Function);
    expect(handleSetNow).toBeInstanceOf(Function);
    expect(result.current.buttonsDisabled).toBe(false);
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
    expect(result.current.elements[0].value).toBe(2020);
    rerender({ ...PROPS, value: DATE_STR });
    expect(result.current.elements).toEqual(getDateElementProps(parseDateString(DATE_STR), false, YEARS_RANGE));
    rerender({ ...TIME_PROPS, value: DATE_STR });
    expect(result.current.elements).toEqual(getDateElementProps(parseDateString(DATE_STR, true), true, YEARS_RANGE));
  });
  test('discards a partial selection when the value changes and then changes back', () => {
    const { result, rerender } = renderHook((props: WidgetProps) => useAltDateWidgetProps(props), {
      initialProps: PROPS,
    });
    act(() => result.current.handleChange('year', '2020'));
    rerender({ ...PROPS, value: DATE_STR });
    rerender(PROPS);
    expect(result.current.elements).toEqual(getDateElementProps(parseDateString(), false, YEARS_RANGE));
  });
  test.each([
    ['a date', PROPS, false],
    ['a date and time', TIME_PROPS, true],
  ])('a stored string that is no %s renders every part unset', (_name, props, time) => {
    const { result } = renderHook(() => useAltDateWidgetProps({ ...props, value: 'not-a-date' }));
    expect(result.current.elements).toEqual(
      getDateElementProps(parseDateString(undefined, time), time, PROPS.options.yearsRange),
    );
  });
  describe('with a parent that stores what it is sent', () => {
    const CLEAR_EVENT = { preventDefault: vi.fn() } as unknown as MouseEvent;
    const BLANK = getDateElementProps(parseDateString(), false, YEARS_RANGE);

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
    let expectedElements = getDateElementProps(dateObj, false, YEARS_RANGE);
    expect(elements).toEqual(expectedElements);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleClear).toBeInstanceOf(Function);
    expect(handleSetNow).toBeInstanceOf(Function);

    const { container, rerender } = render(
      <DateElementsTester elements={elements} handleChange={handleChange} {...PROPS} />,
    );
    await user.selectOptions(elementOf(container, '#root__year'), String(2023 - 2000)); // convert year to index
    expect(PROPS.onChange).not.toHaveBeenCalled();
    rerenderHook(() => useAltDateWidgetProps(PROPS));
    dateObj.year = 2023;
    expectedElements = getDateElementProps(dateObj, false, YEARS_RANGE);
    expect(result.current.elements).toEqual(expectedElements);
    rerender(
      <DateElementsTester elements={result.current.elements} handleChange={result.current.handleChange} {...PROPS} />,
    );
    await user.selectOptions(elementOf(container, '#root__month'), '9'); // Month index
    expect(PROPS.onChange).not.toHaveBeenCalled();
    rerenderHook(() => useAltDateWidgetProps(PROPS));
    dateObj.month = 10;
    expectedElements = getDateElementProps(dateObj, false, YEARS_RANGE);
    expect(result.current.elements).toEqual(expectedElements);
    rerender(
      <DateElementsTester elements={result.current.elements} handleChange={result.current.handleChange} {...PROPS} />,
    );
    await user.selectOptions(elementOf(container, '#root__day'), '1'); // Day index
    expect(PROPS.onChange).toHaveBeenCalledWith('2023-10-02');
  });
  test('time is true, value undefined', () => {
    const { result } = renderHook(() => useAltDateWidgetProps(TIME_PROPS));
    const { elements, handleChange, handleClear, handleSetNow } = result.current;
    const dateObj = parseDateString();
    const expectedElements = getDateElementProps(dateObj, true, YEARS_RANGE);
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
    const expectedElements = getDateElementProps(dateObj, true, YEARS_RANGE);
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
    let expectedElements = getDateElementProps(dateObj, true, YEARS_RANGE);
    expect(elements).toEqual(expectedElements);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleClear).toBeInstanceOf(Function);
    expect(handleSetNow).toBeInstanceOf(Function);

    const { container, rerender } = render(
      <DateElementsTester elements={elements} handleChange={handleChange} {...TIME_PROPS} />,
    );
    await user.selectOptions(elementOf(container, '#root__year'), String(2023 - 2000)); // convert year to index
    expect(TIME_PROPS.onChange).not.toHaveBeenCalled();
    rerenderHook(() => useAltDateWidgetProps(TIME_PROPS));
    dateObj.year = 2023;
    expectedElements = getDateElementProps(dateObj, true, YEARS_RANGE);
    expect(result.current.elements).toEqual(expectedElements);
    rerender(
      <DateElementsTester
        elements={result.current.elements}
        handleChange={result.current.handleChange}
        {...TIME_PROPS}
      />,
    );
    await user.selectOptions(elementOf(container, '#root__month'), '9'); // Month index
    expect(TIME_PROPS.onChange).not.toHaveBeenCalled();
    rerenderHook(() => useAltDateWidgetProps(TIME_PROPS));
    dateObj.month = 10;
    expectedElements = getDateElementProps(dateObj, true, YEARS_RANGE);
    expect(result.current.elements).toEqual(expectedElements);
    rerender(
      <DateElementsTester
        elements={result.current.elements}
        handleChange={result.current.handleChange}
        {...TIME_PROPS}
      />,
    );
    await user.selectOptions(elementOf(container, '#root__day'), '1'); // Day index
    expect(TIME_PROPS.onChange).not.toHaveBeenCalled();
    rerenderHook(() => useAltDateWidgetProps(TIME_PROPS));
    dateObj.day = 2;
    expectedElements = getDateElementProps(dateObj, true, YEARS_RANGE);
    expect(result.current.elements).toEqual(expectedElements);
    rerender(
      <DateElementsTester
        elements={result.current.elements}
        handleChange={result.current.handleChange}
        {...TIME_PROPS}
      />,
    );
    await user.selectOptions(elementOf(container, '#root__hour'), '1');
    expect(TIME_PROPS.onChange).not.toHaveBeenCalled();
    rerenderHook(() => useAltDateWidgetProps(TIME_PROPS));
    dateObj.hour = 1;
    expectedElements = getDateElementProps(dateObj, true, YEARS_RANGE);
    expect(result.current.elements).toEqual(expectedElements);
    rerender(
      <DateElementsTester
        elements={result.current.elements}
        handleChange={result.current.handleChange}
        {...TIME_PROPS}
      />,
    );
    await user.selectOptions(elementOf(container, '#root__minute'), '2');
    rerenderHook(() => useAltDateWidgetProps(TIME_PROPS));
    dateObj.minute = 2;
    expectedElements = getDateElementProps(dateObj, true, YEARS_RANGE);
    expect(result.current.elements).toEqual(expectedElements);
    rerender(
      <DateElementsTester
        elements={result.current.elements}
        handleChange={result.current.handleChange}
        {...TIME_PROPS}
      />,
    );
    await user.selectOptions(elementOf(container, '#root__second'), '3');
    expect(TIME_PROPS.onChange).toHaveBeenCalledWith('2023-10-02T01:02:03.000Z');
  });
  test('time is false, value DATE_STR, disabled', () => {
    const props = { ...PROPS, value: DATE_STR, disabled: true };
    const { result } = renderHook(() => useAltDateWidgetProps(props));
    const { elements, handleChange, handleClear, handleSetNow } = result.current;
    const dateObj = parseDateString(DATE_STR);
    const expectedElements = getDateElementProps(dateObj, false, YEARS_RANGE);
    expect(elements).toEqual(expectedElements);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleClear).toBeInstanceOf(Function);
    expect(handleSetNow).toBeInstanceOf(Function);
    expect(result.current.buttonsDisabled).toBe(true);
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
    const expectedElements = getDateElementProps(dateObj, false, YEARS_RANGE);
    expect(elements).toEqual(expectedElements);
    expect(handleChange).toBeInstanceOf(Function);
    expect(handleClear).toBeInstanceOf(Function);
    expect(handleSetNow).toBeInstanceOf(Function);
    expect(result.current.buttonsDisabled).toBe(true);
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
    const TIME_ELEMENTS = getDateElementProps(parseDateString(), true, YEARS_RANGE);

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

    test('names each element by the element alone when the label is empty', () => {
      renderElements({ label: '' });
      expect(screen.getByRole('combobox', { name: 'year' })).toBeInTheDocument();
    });

    test('gives each element its own id as its name, and describes it by the field', () => {
      renderElements({ label: 'When' });
      const select = screen.getByRole('combobox', { name: 'When, year' });
      expect(select).toHaveAttribute('id', `${TIME_PROPS.id}__year`);
      expect(select).toHaveAttribute('name', `${TIME_PROPS.id}__year`);
      expect(select).toHaveAttribute('aria-describedby', ariaDescribedByIds(TIME_PROPS.id));
    });

    test("describes each element by its field's parts that render, marked invalid while its errors show", () => {
      const presentation = resolveFieldPresentation({
        id: TIME_PROPS.id,
        declaration: {
          label: 'template',
          description: 'template',
          errors: 'template',
          help: 'template',
          labelledBy: 'aria-labelledby',
        },
        label: 'When',
        description: 'The day',
        errors: ['is required'],
      });
      renderElements({ label: 'When', presentation });
      const select = screen.getByRole('combobox', { name: 'When, year' });
      expect(select).toHaveAttribute('aria-describedby', `${TIME_PROPS.id}__error ${TIME_PROPS.id}__description`);
      expect(select).toHaveAttribute('aria-invalid', 'true');
      expect(select).not.toHaveAttribute('aria-labelledby');
    });

    test('describes and marks each element by the attributes its caller gives, without a plan', () => {
      render(
        <DateElement
          rootId='other'
          label='Other'
          type='year'
          range={[2020, 2024]}
          value={-1}
          select={vi.fn()}
          registry={REGISTRY}
          onBlur={vi.fn()}
          onFocus={vi.fn()}
          attributes={{ 'aria-describedby': 'other__error other__success', 'aria-invalid': true }}
        />,
      );
      const select = screen.getByRole('combobox', { name: 'Other, year' });
      expect(select).toHaveAttribute('aria-describedby', 'other__error other__success');
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });

    test("describes each element by the attributes its caller gives over its plan's, keeping the rest", () => {
      const presentation = resolveFieldPresentation({
        id: TIME_PROPS.id,
        declaration: {
          label: 'template',
          description: 'template',
          errors: 'template',
          help: 'template',
          labelledBy: 'aria-labelledby',
        },
        label: 'When',
        errors: ['is required'],
      });
      render(
        <DateElement
          rootId={TIME_PROPS.id}
          label='When'
          type='year'
          range={[2020, 2024]}
          value={-1}
          select={vi.fn()}
          registry={REGISTRY}
          onBlur={vi.fn()}
          onFocus={vi.fn()}
          presentation={presentation}
          attributes={{ 'aria-describedby': `${TIME_PROPS.id}__error ${TIME_PROPS.id}__success` }}
        />,
      );
      const select = screen.getByRole('combobox', { name: 'When, year' });
      expect(select).toHaveAttribute('aria-describedby', `${TIME_PROPS.id}__error ${TIME_PROPS.id}__success`);
      expect(select).toHaveAttribute('aria-invalid', 'true');
    });

    test('names an element by the translated name its caller already has, without translating it again', () => {
      const translateString = vi.fn(englishStringTranslator);
      render(
        <DateElement
          rootId='root'
          label='When'
          elementLabel='Année'
          type='year'
          range={[2020, 2024]}
          value={-1}
          select={vi.fn()}
          registry={{ ...REGISTRY, translateString }}
          onBlur={vi.fn()}
          onFocus={vi.fn()}
        />,
      );
      expect(screen.getByRole('combobox', { name: 'When, Année' })).toHaveDisplayValue('Année');
      expect(translateString).toHaveBeenCalledTimes(1);
    });

    test('translates the name and the placeholder of each element', () => {
      const translateString = vi.fn((key: string, params?: string[]) =>
        params ? `${params[1]} / ${params[0]}` : `[${key}]`,
      );
      renderElements({ label: 'When' }, { ...REGISTRY, translateString });
      const select = screen.getByRole('combobox', { name: '[minute] / When' });
      expect(select).toHaveDisplayValue('[minute]');
    });
  });
  test('DateElement hands its SelectWidget the options its caller gives, beside its own enumOptions', () => {
    const SpySelectWidget = vi.fn((props: WidgetProps) => SelectWidget(props));
    const registry = { ...REGISTRY, widgets: { SelectWidget: SpySelectWidget } } as unknown as Registry;
    render(
      <DateElement
        rootId='root'
        type='month'
        range={[1, 12]}
        value={-1}
        select={vi.fn()}
        registry={registry}
        onBlur={vi.fn()}
        onFocus={vi.fn()}
        elementOptions={{ searchable: false, enumOptions: [{ value: 0, label: 'replaced' }] }}
      />,
    );
    const { options, uiSchema } = SpySelectWidget.mock.calls[0][0];
    expect(options.searchable).toBe(false);
    expect(options.enumOptions).toHaveLength(12);
    expect(options.enumOptions?.[0]).toEqual({ value: 1, label: '01' });
    expect(uiSchema?.['ui:options']).toEqual(options);
  });
  test('DateElement hands its SelectWidget an unset element as undefined, and a set one as it is', () => {
    const SpySelectWidget = vi.fn((props: WidgetProps) => SelectWidget(props));
    const registry = { ...REGISTRY, widgets: { SelectWidget: SpySelectWidget } } as unknown as Registry;
    const elementProps = { rootId: 'root', select: vi.fn(), registry, onBlur: vi.fn(), onFocus: vi.fn() };
    render(
      <>
        <DateElement {...elementProps} type='year' range={[2000, 2030]} value={-1} />
        <DateElement {...elementProps} type='month' range={[1, 12]} value={10} />
        <DateElement {...elementProps} type='hour' range={[0, 23]} value={0} />
      </>,
    );
    const valueOf = (id: string): unknown => SpySelectWidget.mock.calls.find(([props]) => props.id === id)?.[0].value;
    expect(valueOf('root__year')).toBeUndefined();
    expect(valueOf('root__month')).toBe(10);
    expect(valueOf('root__hour')).toBe(0);
  });
});
