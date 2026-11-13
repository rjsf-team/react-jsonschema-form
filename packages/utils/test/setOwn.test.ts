import setOwn from '../src/setOwn.ts';

describe('setOwn()', () => {
  it('writes a plain key', () => {
    const obj: Record<string, unknown> = {};
    setOwn(obj, 'a', 1);
    expect(obj).toEqual({ a: 1 });
  });

  it('throws for an object it cannot write to, rather than dropping the value', () => {
    expect(() => setOwn(Object.freeze({}), 'a', 1)).toThrow(TypeError);
  });

  it('writes __proto__ as an own key without changing the prototype', () => {
    const obj: Record<string, unknown> = {};
    setOwn(obj, '__proto__', { x: 1 });
    expect(Object.hasOwn(obj, '__proto__')).toBe(true);
    expect(Object.getPrototypeOf(obj)).toBe(Object.prototype);
    expect(Object.getOwnPropertyDescriptor(obj, '__proto__')?.value).toEqual({
      x: 1,
    });
  });
});
