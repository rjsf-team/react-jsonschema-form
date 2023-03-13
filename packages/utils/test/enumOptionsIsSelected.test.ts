import { enumOptionsIsSelected } from '../src';

const VALUE = { foo: 'bar' };
const VALUES = [VALUE, 'another'];
describe('enumOptionsIsSelected()', () => {
  it('returns false when two values do not match', () => {
    expect(enumOptionsIsSelected(undefined, null)).toBe(false);
  });
  it('returns true when two values match', () => {
    expect(enumOptionsIsSelected(VALUE, { foo: 'bar' })).toBe(true);
  });
  it('returns false when value is not in array of selected values', () => {
    expect(enumOptionsIsSelected('foo', VALUES)).toBe(false);
  });
  it('returns true when value is in array of selected values', () => {
    expect(enumOptionsIsSelected({ foo: 'bar' }, VALUES)).toBe(true);
  });
});
