import isPlainObject from '../src/isPlainObject';

describe('isPlainObject()', () => {
  it('returns false for non-objects', () => {
    expect(isPlainObject(undefined)).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject(1)).toBe(false);
    expect(isPlainObject('string')).toBe(false);
    expect(isPlainObject(true)).toBe(false);
    expect(isPlainObject(() => {})).toBe(false);
  });
  it('returns true for object literals and null-prototype objects', () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ foo: 'bar' })).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
  });
  it('returns false for arrays and class instances', () => {
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject([1, 2])).toBe(false);
    expect(isPlainObject(new Error('an error'))).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(new Map())).toBe(false);
  });
});
