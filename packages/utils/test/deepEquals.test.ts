import { deepEquals } from '../src';

describe('deepEquals()', () => {
  // Note: deepEquals implementation uses isEqualWith, so we focus on the behavioral differences we introduced.
  it('should assume functions are always equivalent', () => {
    expect(
      deepEquals(
        () => {},
        () => {}
      )
    ).toBe(true);
    expect(deepEquals({ foo() {} }, { foo() {} })).toBe(true);
    expect(deepEquals({ foo: { bar() {} } }, { foo: { bar() {} } })).toBe(true);
  });
});
