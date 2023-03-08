import { enumOptionsIndexForValue } from '../src';
import { ALL_OPTIONS } from './testUtils/testData';

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
});
