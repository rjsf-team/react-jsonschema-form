import { enumOptionsIsDisabled } from '../src/index.ts';

describe('enumOptionsIsDisabled()', () => {
  it('returns true when the value is in the list', () => {
    expect(enumOptionsIsDisabled('b', ['a', 'b'])).toBe(true);
  });
  it('returns false when the value is not in the list', () => {
    expect(enumOptionsIsDisabled('c', ['a', 'b'])).toBe(false);
  });
  it('matches primitives strictly', () => {
    expect(enumOptionsIsDisabled(1, ['1'])).toBe(false);
  });
  it('matches null', () => {
    expect(enumOptionsIsDisabled(null, [null])).toBe(true);
  });
  it.each([
    ['an object', { id: 1 }, { id: 1 }, true],
    ['an array', [1, 2], [1, 2], true],
    ['a different object', { id: 1 }, { id: 2 }, false],
    ['an object for its string form', '[object Object]', { id: 1 }, false],
  ])('compares %s by deep equality', (_, value, disabled, expected) => {
    expect(enumOptionsIsDisabled(value, [disabled])).toBe(expected);
  });
  it('returns false when there is no list', () => {
    expect(enumOptionsIsDisabled('a')).toBe(false);
  });
});
