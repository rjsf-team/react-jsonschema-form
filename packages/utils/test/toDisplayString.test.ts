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
  it('converts values other than plain objects and arrays the way String() does', () => {
    class Money {
      amount = 5;
      toString() {
        return `USD ${this.amount}`;
      }
    }
    const fn = () => 1;
    const date = new Date(0);
    expect(toDisplayString(new TypeError('boom'))).toBe('TypeError: boom');
    expect(toDisplayString(fn)).toBe(String(fn));
    expect(toDisplayString(/ab+c/)).toBe('/ab+c/');
    expect(toDisplayString(date)).toBe(String(date));
    expect(toDisplayString(new Map([[1, 2]]))).toBe('[object Map]');
    expect(toDisplayString(new Money())).toBe('USD 5');
  });
  it('spells plain objects and arrays out as JSON', () => {
    const nullPrototype = Object.assign(Object.create(null) as object, { a: 1 });
    expect(toDisplayString({ a: 1 })).toBe('{"a":1}');
    expect(toDisplayString(nullPrototype)).toBe('{"a":1}');
    expect(toDisplayString([1, 'b'])).toBe('[1,"b"]');
  });
  it('throws for a plain object or array JSON.stringify() cannot convert', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => toDisplayString(circular)).toThrow(TypeError);
    expect(() => toDisplayString([1n])).toThrow(TypeError);
  });
});
