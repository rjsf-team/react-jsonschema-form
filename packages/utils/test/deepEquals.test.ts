import { deepEqualsIgnoringUndefined } from '../src/deepEquals.ts';
import { deepEquals } from '../src/index.ts';

describe('deepEquals()', () => {
  it('should assume functions are always equivalent', () => {
    expect(
      deepEquals(
        () => {
          /* empty */
        },
        () => {
          /* empty */
        },
      ),
    ).toBe(true);
    expect(
      deepEquals(
        {
          foo() {
            /* empty */
          },
        },
        {
          foo() {
            /* empty */
          },
        },
      ),
    ).toBe(true);
    expect(
      deepEquals(
        {
          foo: {
            bar() {
              /* empty */
            },
          },
        },
        {
          foo: {
            bar() {
              /* empty */
            },
          },
        },
      ),
    ).toBe(true);
  });

  it('does not stack-overflow on self-referential objects', () => {
    const a: any = { foo: 1 };
    a.self = a;
    const b: any = { foo: 1 };
    b.self = b;
    expect(() => deepEquals(a, b)).not.toThrow();
    expect(deepEquals(a, b)).toBe(true);
  });

  it('detects differences in self-referential objects', () => {
    const a: any = { foo: 1 };
    a.self = a;
    const b: any = { foo: 2 };
    b.self = b;
    expect(deepEquals(a, b)).toBe(false);
  });

  it('does not stack-overflow on mutually-referential objects', () => {
    const a1: any = { name: 'a' };
    const a2: any = { name: 'b' };
    a1.partner = a2;
    a2.partner = a1;

    const b1: any = { name: 'a' };
    const b2: any = { name: 'b' };
    b1.partner = b2;
    b2.partner = b1;

    expect(() => deepEquals(a1, b1)).not.toThrow();
    expect(deepEquals(a1, b1)).toBe(true);
  });

  it('does not stack-overflow on cyclic arrays', () => {
    const a: any[] = [1];
    a.push(a);
    const b: any[] = [1];
    b.push(b);
    expect(() => deepEquals(a, b)).not.toThrow();
    expect(deepEquals(a, b)).toBe(true);
  });
});

describe('deepEqualsIgnoringUndefined()', () => {
  it('assumes functions are always equivalent', () => {
    expect(deepEqualsIgnoringUndefined({ fn: () => undefined }, { fn: (a: number) => a + 1 })).toBe(true);
  });

  it('disregards undefined-valued keys on either side, at any depth', () => {
    expect(deepEqualsIgnoringUndefined({ a: 1, b: undefined }, { a: 1 })).toBe(true);
    expect(deepEqualsIgnoringUndefined({ a: 1 }, { a: 1, b: undefined })).toBe(true);
    expect(deepEqualsIgnoringUndefined([{ a: 1, b: undefined }], [{ a: 1 }])).toBe(true);
    expect(deepEqualsIgnoringUndefined({ o: { a: 1, b: undefined } }, { o: { a: 1 } })).toBe(true);
  });

  it('still reports a difference in the defined keys', () => {
    expect(deepEqualsIgnoringUndefined({ a: 1, b: undefined }, { a: 2 })).toBe(false);
    expect(deepEqualsIgnoringUndefined({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqualsIgnoringUndefined({ a: 1, b: undefined }, { a: 1, c: undefined, d: 2 })).toBe(false);
    expect(deepEqualsIgnoringUndefined({ a: 1, b: undefined }, { b: undefined, c: 1 })).toBe(false);
  });

  it('does not match a key against one the other side only inherits', () => {
    expect(deepEqualsIgnoringUndefined(JSON.parse('{"__proto__": {}}'), { q: 1 })).toBe(false);
    expect(deepEqualsIgnoringUndefined({ toString: () => 'x' }, { y: 1 })).toBe(false);
  });

  it('does not stack-overflow on self-referential objects', () => {
    const a: any = { name: 'a', gone: undefined };
    a.self = a;
    const b: any = { name: 'a' };
    b.self = b;

    expect(() => deepEqualsIgnoringUndefined(a, b)).not.toThrow();
    expect(deepEqualsIgnoringUndefined(a, b)).toBe(true);
  });
});
