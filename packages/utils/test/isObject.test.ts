import { isObject } from '../src';

const NON_OBJECTS = ['string', 10, NaN, true, null, undefined];

const OBJECTS = [{ plain: 'object' }, new Object(), new Map()];

describe('isObject()', () => {
  it('returns false when a non-object is provided', () => {
    NON_OBJECTS.forEach((nonObject: string | number | boolean | null | undefined) => {
      expect(isObject(nonObject)).toBe(false);
    });
  });
  it('returns false when a File is provided', () => {
    const file = new File(['test'], 'test.txt');
    expect(isObject(file)).toBe(false);
  });
  it('returns false when a Date is provided', () => {
    const date = new Date();
    expect(isObject(date)).toBe(false);
  });
  it('returns false when an array is provided', () => {
    expect(isObject(['foo'])).toBe(false);
  });
  it('returns true when an object is provided', () => {
    OBJECTS.forEach((object: any) => {
      expect(isObject(object)).toBe(true);
    });
  });
});
