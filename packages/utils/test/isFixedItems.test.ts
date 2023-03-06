import { isFixedItems } from '../src';

describe('isFixedItems()', () => {
  it('returns false when schema.items is not an array', () => {
    expect(isFixedItems({})).toBe(false);
  });
  it('returns false when schema.items is an empty array', () => {
    expect(isFixedItems({ items: [] })).toBe(false);
  });
  it('returns false when schema.items do not contain objects', () => {
    expect(isFixedItems({ items: [{}, true] })).toBe(false);
  });
  it('returns true when schema.items are all objects', () => {
    expect(isFixedItems({ items: [{}, {}] })).toBe(true);
  });
});
