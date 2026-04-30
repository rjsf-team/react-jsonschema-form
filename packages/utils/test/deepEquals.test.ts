import { deepEquals } from '../src';

describe('deepEquals()', () => {
  it('should assume functions are always equivalent', () => {
    expect(
      deepEquals(
        () => {},
        () => {},
      ),
    ).toBe(true);
    expect(deepEquals({ foo() {} }, { foo() {} })).toBe(true);
    expect(deepEquals({ foo: { bar() {} } }, { foo: { bar() {} } })).toBe(true);
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
