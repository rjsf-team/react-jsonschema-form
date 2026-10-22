import { copyAlongPath } from '../src/components/formState.ts';

describe('copyAlongPath()', () => {
  it('copies the containers along the path and shares everything off it', () => {
    const data = { a: { b: { c: 1 } }, d: { e: 2 } };

    const copy = copyAlongPath(data, ['a', 'b', 'c']);

    expect(copy).toEqual(data);
    expect(copy).not.toBe(data);
    expect(copy.a).not.toBe(data.a);
    expect(copy.a.b).not.toBe(data.a.b);
    expect(copy.d).toBe(data.d);
  });

  it('leaves the prototype alone for a __proto__ segment the data does not hold as its own key', () => {
    const copy = copyAlongPath<Record<string, unknown>>({ s: 'a' }, ['__proto__', 'x']);

    expect(Object.getPrototypeOf(copy)).toBe(Object.prototype);
    expect(copy).toEqual({ s: 'a' });
  });

  it('copies a __proto__ property the data holds as its own key', () => {
    const data: Record<string, unknown> = JSON.parse('{"__proto__": {"x": "a"}}');

    const copy = copyAlongPath(data, ['__proto__', 'x']);

    expect(Object.getPrototypeOf(copy)).toBe(Object.prototype);
    expect(Object.hasOwn(copy, '__proto__')).toBe(true);
    expect(Object.getOwnPropertyDescriptor(copy, '__proto__')?.value).not.toBe(
      Object.getOwnPropertyDescriptor(data, '__proto__')?.value,
    );
  });
});
