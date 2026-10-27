import { toInputValue } from '../src/index.ts';

describe('toInputValue', () => {
  it('keeps a string', () => {
    expect(toInputValue('text')).toBe('text');
  });
  it('keeps a number, zero included', () => {
    expect(toInputValue(0)).toBe(0);
    expect(toInputValue(1.5)).toBe(1.5);
  });
  it('turns undefined and null into an empty string', () => {
    expect(toInputValue(undefined)).toBe('');
    expect(toInputValue(null)).toBe('');
  });
  it('stringifies a boolean or a bigint the way React renders a value prop', () => {
    expect(toInputValue(true)).toBe('true');
    expect(toInputValue(BigInt(2))).toBe('2');
  });
  it('joins an array with commas the way React renders a value prop', () => {
    expect(toInputValue(['a', 'b'])).toBe('a,b');
    expect(toInputValue([1, null, 'c'])).toBe('1,,c');
  });
  it('turns an object into an empty string', () => {
    expect(toInputValue({ a: 1 })).toBe('');
  });
});
