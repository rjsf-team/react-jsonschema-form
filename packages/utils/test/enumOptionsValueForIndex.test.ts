import { enumOptionsValueForIndex } from '../src';
import { ALL_OPTIONS } from './testUtils/testData';

const EMPTY_VALUE = 'empty';

describe('enumOptionsValueForIndex()', () => {
  it('returns undefined for a single negative index', () => {
    expect(enumOptionsValueForIndex('-1', ALL_OPTIONS)).toBeUndefined();
  });
  it('returns undefined for an empty string', () => {
    expect(enumOptionsValueForIndex('', ALL_OPTIONS)).toBeUndefined();
  });
  it('returns undefined for a single index >= array size', () => {
    expect(enumOptionsValueForIndex(ALL_OPTIONS.length, ALL_OPTIONS)).toBeUndefined();
  });
  it('returns emptyValue for a single negative index', () => {
    expect(enumOptionsValueForIndex('-1', ALL_OPTIONS, EMPTY_VALUE)).toBe(EMPTY_VALUE);
  });
  it('returns emptyValue for an empty string', () => {
    expect(enumOptionsValueForIndex('', ALL_OPTIONS, EMPTY_VALUE)).toBe(EMPTY_VALUE);
  });
  it('returns emptyValue for a single index >= array size', () => {
    expect(enumOptionsValueForIndex(ALL_OPTIONS.length, ALL_OPTIONS, EMPTY_VALUE)).toBe(EMPTY_VALUE);
  });
  it('returns undefined when no options are provided', () => {
    expect(enumOptionsValueForIndex(0)).toBeUndefined();
  });
  it('returns value of option at a valid index', () => {
    expect(enumOptionsValueForIndex(2, ALL_OPTIONS)).toEqual(ALL_OPTIONS[2].value);
  });
  it('returns empty array for a list of bad indexes', () => {
    expect(enumOptionsValueForIndex(['-2', ALL_OPTIONS.length + 1], ALL_OPTIONS)).toEqual([]);
  });
  it('returns empty array for a list of bad indexes, even with empty value', () => {
    expect(enumOptionsValueForIndex(['-2', ALL_OPTIONS.length + 1], ALL_OPTIONS, EMPTY_VALUE)).toEqual([]);
  });
  it('returns array of values for a list of good indexes', () => {
    const expected = [ALL_OPTIONS[2].value, ALL_OPTIONS[1].value];
    expect(enumOptionsValueForIndex([2, 1], ALL_OPTIONS)).toEqual(expected);
  });
});
