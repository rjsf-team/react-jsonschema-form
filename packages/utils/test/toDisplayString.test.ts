import { toDisplayString } from '../src/index.ts';

describe('toDisplayString()', () => {
  it('converts primitives the way String() does', () => {
    expect(toDisplayString('foo')).toBe('foo');
    expect(toDisplayString(1.5)).toBe('1.5');
    expect(toDisplayString(false)).toBe('false');
    expect(toDisplayString(10n)).toBe('10');
    expect(toDisplayString(Symbol('s'))).toBe('Symbol(s)');
    expect(toDisplayString(undefined)).toBe('undefined');
    expect(toDisplayString(null)).toBe('null');
  });
  it('converts errors and functions with their own toString()', () => {
    expect(toDisplayString(new TypeError('boom'))).toBe('TypeError: boom');
    const fn = () => 1;
    expect(toDisplayString(fn)).toBe(fn.toString());
  });
  it('spells objects and arrays out as JSON', () => {
    expect(toDisplayString({ a: 1 })).toBe('{"a":1}');
    expect(toDisplayString([1, 'b'])).toBe('[1,"b"]');
  });
});
