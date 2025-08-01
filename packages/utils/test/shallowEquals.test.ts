import { shallowEquals } from '../src';

describe('shallowEquals()', () => {
  it('should return true for identical references', () => {
    const obj = { a: 1 };
    expect(shallowEquals(obj, obj)).toBe(true);
  });

  it('should return true for primitive values using Object.is', () => {
    expect(shallowEquals(1, 1)).toBe(true);
    expect(shallowEquals('test', 'test')).toBe(true);
    expect(shallowEquals(true, true)).toBe(true);
    expect(shallowEquals(null, null)).toBe(true);
    expect(shallowEquals(undefined, undefined)).toBe(true);
  });

  it('should return false for different primitive values', () => {
    expect(shallowEquals(1, 2)).toBe(false);
    expect(shallowEquals('test', 'other')).toBe(false);
    expect(shallowEquals(true, false)).toBe(false);
  });

  it('should handle null and undefined values', () => {
    expect(shallowEquals(null, undefined)).toBe(false);
    expect(shallowEquals(null, {})).toBe(false);
    expect(shallowEquals(undefined, {})).toBe(false);
    expect(shallowEquals({}, null)).toBe(false);
    expect(shallowEquals({}, undefined)).toBe(false);
  });

  it('should return false for objects with different number of keys', () => {
    expect(shallowEquals({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(shallowEquals({ a: 1, b: 2 }, { a: 1 })).toBe(false);
  });

  it('should return true for objects with same keys and shallow equal values', () => {
    expect(shallowEquals({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
    expect(shallowEquals({ a: 'test', b: true }, { a: 'test', b: true })).toBe(true);
  });

  it('should return false for objects with different values', () => {
    expect(shallowEquals({ a: 1 }, { a: 2 })).toBe(false);
    expect(shallowEquals({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false);
  });

  it('should handle function references correctly with Object.is', () => {
    const fn1 = () => {};
    const fn2 = () => {};

    // Same function reference should be equal
    expect(shallowEquals({ fn: fn1 }, { fn: fn1 })).toBe(true);

    // Different function references should not be equal
    expect(shallowEquals({ fn: fn1 }, { fn: fn2 })).toBe(false);
  });

  it('should return false for nested object changes (shallow comparison)', () => {
    const obj1 = { nested: { value: 1 } };
    const obj2 = { nested: { value: 1 } }; // Different reference but same content

    // Different object references should not be equal with shallow comparison
    expect(shallowEquals(obj1, obj2)).toBe(false);

    // Same object reference should be equal
    expect(shallowEquals(obj1, obj1)).toBe(true);
  });

  it('should handle missing keys correctly', () => {
    expect(shallowEquals({ a: 1 }, {})).toBe(false);
    expect(shallowEquals({}, { a: 1 })).toBe(false);
  });

  it('should handle objects with hasOwnProperty correctly', () => {
    const obj1 = { a: 1, hasOwnProperty: 'custom' };
    const obj2 = { a: 1, hasOwnProperty: 'custom' };
    expect(shallowEquals(obj1, obj2)).toBe(true);
  });

  it('should return false for non-object types when not identical', () => {
    expect(shallowEquals('string', 123)).toBe(false);
    expect(shallowEquals(true, 'true')).toBe(false);
    expect(shallowEquals([1], { a: 1 })).toBe(false); // Different key structure
  });

  it('should handle arrays as objects', () => {
    expect(shallowEquals([1, 2], [1, 2])).toBe(true);
    expect(shallowEquals([1, 2], [1, 3])).toBe(false);
    expect(shallowEquals([1, 2], [1, 2, 3])).toBe(false);
  });

  it('should handle empty objects', () => {
    expect(shallowEquals({}, {})).toBe(true);
    expect(shallowEquals([], [])).toBe(true);
  });
});
