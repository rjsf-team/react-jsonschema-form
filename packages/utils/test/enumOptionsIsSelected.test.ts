import { enumOptionsIsSelected } from '../src/index.ts';

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
  it('returns true when an array value is the whole selection of a single select', () => {
    expect(enumOptionsIsSelected([2], [2], false)).toBe(true);
  });
  it('does not match an entry of an array selection of a single select', () => {
    expect(enumOptionsIsSelected('a', ['a', 'b'], false)).toBe(false);
  });
  it('reads an array selection as a list of selections when multiple', () => {
    expect(enumOptionsIsSelected([2], [[1], [2]], true)).toBe(true);
    expect(enumOptionsIsSelected(['a', 'b'], ['a', 'b'], true)).toBe(false);
  });
});
