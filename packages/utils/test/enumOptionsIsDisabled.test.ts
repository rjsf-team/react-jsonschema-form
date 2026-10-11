import { enumOptionsIsDisabled } from '../src/index.ts';

describe('enumOptionsIsDisabled()', () => {
  it('returns true when the value is in the list', () => {
    expect(enumOptionsIsDisabled('b', ['a', 'b'])).toBe(true);
  });
  it('returns false when the value is not in the list', () => {
    expect(enumOptionsIsDisabled('c', ['a', 'b'])).toBe(false);
  });
  it('matches strictly', () => {
    expect(enumOptionsIsDisabled(1, ['1'])).toBe(false);
  });
  it('returns false when there is no list', () => {
    expect(enumOptionsIsDisabled('a')).toBe(false);
  });
});
