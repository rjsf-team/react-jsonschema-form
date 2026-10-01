import { mapFieldChange, resolveFieldChange } from '../src/index.ts';

describe('resolveFieldChange()', () => {
  it('returns a value as is', () => {
    expect(resolveFieldChange<number[]>([1], [2])).toEqual([1]);
  });
  it('applies an updater to the current value and any further arguments', () => {
    expect(resolveFieldChange((current: number, add: number) => current + add, 1, 2)).toBe(3);
  });
});

describe('mapFieldChange()', () => {
  const double = (value: number) => value * 2;
  it('transforms a value', () => {
    expect(mapFieldChange(3, double)).toBe(6);
  });
  it('transforms what an updater returns', () => {
    const mapped = mapFieldChange((current: number) => current + 1, double);
    expect(resolveFieldChange(mapped, 3)).toBe(8);
  });
});
