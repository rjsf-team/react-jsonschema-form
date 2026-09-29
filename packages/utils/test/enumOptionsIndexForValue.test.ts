import { enumOptionsIndexForValue } from '../src/index.ts';
import { ALL_OPTIONS } from './testUtils/testData.ts';

const VALUE = ALL_OPTIONS[1].value;
const VALUES = [ALL_OPTIONS[1].value, ALL_OPTIONS[0].value];

describe('enumOptionsIndexForValue()', () => {
  it("returns undefined when value isn't in options", () => {
    expect(enumOptionsIndexForValue('xxx')).toBeUndefined();
  });
  it("returns undefined when values aren't in options", () => {
    expect(enumOptionsIndexForValue(['xxx'])).toBeUndefined();
  });
  it("returns index of value that matches an option's value", () => {
    expect(enumOptionsIndexForValue(VALUE, ALL_OPTIONS)).toEqual('1');
  });
  it("returns index of first value that matches an option's value", () => {
    expect(enumOptionsIndexForValue(VALUES, ALL_OPTIONS)).toEqual('0');
  });
  it("returns empty array when value isn't in options, multiple", () => {
    expect(enumOptionsIndexForValue(['xxx'], ALL_OPTIONS, true)).toEqual([]);
  });
  it("returns index of value that matches an option's value, multiple", () => {
    expect(enumOptionsIndexForValue(VALUE, ALL_OPTIONS, true)).toEqual(['1']);
  });
  it("returns index of first value that matches an option's value, multiple", () => {
    expect(enumOptionsIndexForValue(VALUES, ALL_OPTIONS, true)).toEqual(['0', '1']);
  });
  it('returns the index of an array option that matches the whole value', () => {
    const arrayOptions = [
      { value: [1], label: 'One' },
      { value: [2], label: 'Two' },
    ];
    expect(enumOptionsIndexForValue([2], arrayOptions)).toEqual('1');
  });
  it('prefers an array option that matches the whole value over the options for its entries', () => {
    const mixedOptions = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B' },
      { value: ['a', 'b'], label: 'Both' },
    ];
    expect(enumOptionsIndexForValue(['a', 'b'], mixedOptions)).toEqual('2');
    expect(enumOptionsIndexForValue(['a', 'b'], mixedOptions, true)).toEqual(['0', '1']);
  });
});
