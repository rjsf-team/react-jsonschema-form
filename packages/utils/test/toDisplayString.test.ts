import toDisplayString from '../src/toDisplayString.ts';

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
    const nullPrototype = { a: 1 };
    Object.setPrototypeOf(nullPrototype, null);
    expect(toDisplayString({ a: 1 })).toBe('{"a":1}');
    expect(toDisplayString(nullPrototype)).toBe('{"a":1}');
    expect(toDisplayString([1, 'b'])).toBe('[1,"b"]');
  });
  it('spells nested values JSON has no form for the way String() does', () => {
    expect(toDisplayString({ cause: new Error('a') })).toBe('{"cause":"Error: a"}');
    expect(toDisplayString([/x/, 10n])).toBe('["/x/","10"]');
    expect(toDisplayString([new Date(0)])).toBe(JSON.stringify([new Date(0)]));
  });
  it('falls back to String() for a plain object or array JSON.stringify() cannot convert', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const circularArray: unknown[] = [1];
    circularArray.push(circularArray);
    expect(toDisplayString(circular)).toBe('[object Object]');
    expect(toDisplayString(circularArray)).toBe('1,');
    expect(toDisplayString({ toJSON: () => undefined })).toBe('[object Object]');
  });
  it('throws where String() does, for a circular object with no prototype', () => {
    const circular: Record<string, unknown> = {};
    Object.setPrototypeOf(circular, null);
    circular.self = circular;
    expect(() => toDisplayString(circular)).toThrow(TypeError);
  });
});
