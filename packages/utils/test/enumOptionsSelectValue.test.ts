import type { EnumOptionsType } from '../src/index.ts';
import { enumOptionsSelectValue } from '../src/index.ts';
import { ALL_OPTIONS, FALSY_OPTIONS } from './testUtils/testData.ts';

describe('enumOptionsSelectValue()', () => {
  let selected: EnumOptionsType['value'][];
  it('adds a value to an empty list', () => {
    const { value } = ALL_OPTIONS[2];
    selected = enumOptionsSelectValue('2', [], ALL_OPTIONS);
    expect(selected).toEqual([value]);
  });
  it('adds a second value to an existing list in the correct position', () => {
    const { value } = ALL_OPTIONS[0];
    const expected = [value, ...selected];
    selected = enumOptionsSelectValue(0, selected, ALL_OPTIONS);
    expect(selected).toEqual(expected);
  });
  it('adds a third value to an existing list in the correct position', () => {
    const { value } = ALL_OPTIONS[3];
    const expected = [...selected, value];
    selected = enumOptionsSelectValue(3, selected, ALL_OPTIONS);
    expect(selected).toEqual(expected);
  });
  it('adds the last value to an existing list in the correct position', () => {
    const expected = ALL_OPTIONS.map(({ value }) => value);
    expect(enumOptionsSelectValue(1, selected, ALL_OPTIONS)).toEqual(expected);
  });
  it('returns the selected array unchanged when index is -1', () => {
    expect(enumOptionsSelectValue(-1, selected, ALL_OPTIONS)).toBe(selected);
  });
  it('returns the selected array unchanged when index >= length', () => {
    expect(enumOptionsSelectValue(ALL_OPTIONS.length, selected, ALL_OPTIONS)).toBe(selected);
  });
  it('returns the selected array unchanged when options are missing', () => {
    expect(enumOptionsSelectValue(0, selected)).toBe(selected);
  });
  it('handles falsy values', () => {
    selected = [];
    const expected: any[] = [];
    FALSY_OPTIONS.forEach((option, index) => {
      expected.push(option.value);
      selected = enumOptionsSelectValue(index, selected, FALSY_OPTIONS);
      expect(selected).toStrictEqual(expected);
    });
  });
  it('orders an object option equal to, but not the same instance as, its constant', () => {
    const objectOptions: EnumOptionsType[] = [
      { value: { a: 1 }, label: 'One' },
      { value: { a: 2 }, label: 'Two' },
    ];
    expect(enumOptionsSelectValue(0, [{ a: 2 }], objectOptions)).toEqual([{ a: 1 }, { a: 2 }]);
  });
  it('selects a null option', () => {
    const nullableOptions: EnumOptionsType[] = [
      { value: null, label: 'None' },
      { value: 1, label: 'One' },
    ];
    expect(enumOptionsSelectValue(0, [1], nullableOptions)).toEqual([null, 1]);
  });
  it('does not add a value that is already selected', () => {
    expect(enumOptionsSelectValue(1, ['b'], [{ value: 'a' }, { value: 'b' }] as EnumOptionsType[])).toEqual(['b']);
  });
  it('keeps a selected value that matches no option after the ones that do', () => {
    expect(enumOptionsSelectValue(0, ['stale', 'b'], [{ value: 'a' }, { value: 'b' }] as EnumOptionsType[])).toEqual([
      'a',
      'b',
      'stale',
    ]);
  });
});
