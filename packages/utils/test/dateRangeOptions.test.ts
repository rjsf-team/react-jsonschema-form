import { dateRangeOptions, pad } from '../src';

describe('dateRangeOptions()', () => {
  it('start & stop are positive integers, where stop < start', () => {
    expect(dateRangeOptions(2, 10)).toEqual([
      { value: 2, label: pad(2, 2) },
      { value: 3, label: pad(3, 2) },
      { value: 4, label: pad(4, 2) },
      { value: 5, label: pad(5, 2) },
      { value: 6, label: pad(6, 2) },
      { value: 7, label: pad(7, 2) },
      { value: 8, label: pad(8, 2) },
      { value: 9, label: pad(9, 2) },
      { value: 10, label: pad(10, 2) },
    ]);
  });
  it('start & stop are positive integers, where stop > start', () => {
    expect(dateRangeOptions(10, 2)).toEqual([
      { value: 10, label: pad(10, 2) },
      { value: 9, label: pad(9, 2) },
      { value: 8, label: pad(8, 2) },
      { value: 7, label: pad(7, 2) },
      { value: 6, label: pad(6, 2) },
      { value: 5, label: pad(5, 2) },
      { value: 4, label: pad(4, 2) },
      { value: 3, label: pad(3, 2) },
      { value: 2, label: pad(2, 2) },
    ]);
  });
  it('start & stop are negative integers, returns years from today in reverse order', () => {
    const startYear = new Date().getFullYear() - 10;
    expect(dateRangeOptions(-10, 0)).toEqual([
      { value: startYear, label: `${startYear}` },
      { value: startYear + 1, label: `${startYear + 1}` },
      { value: startYear + 2, label: `${startYear + 2}` },
      { value: startYear + 3, label: `${startYear + 3}` },
      { value: startYear + 4, label: `${startYear + 4}` },
      { value: startYear + 5, label: `${startYear + 5}` },
      { value: startYear + 6, label: `${startYear + 6}` },
      { value: startYear + 7, label: `${startYear + 7}` },
      { value: startYear + 8, label: `${startYear + 8}` },
      { value: startYear + 9, label: `${startYear + 9}` },
      { value: startYear + 10, label: `${startYear + 10}` },
    ]);
  });
  it('start & stop are negative integers, returns years from today in reverse order', () => {
    const startYear = new Date().getFullYear() - 2;
    expect(dateRangeOptions(-2, -10)).toEqual([
      { value: startYear, label: `${startYear}` },
      { value: startYear - 1, label: `${startYear - 1}` },
      { value: startYear - 2, label: `${startYear - 2}` },
      { value: startYear - 3, label: `${startYear - 3}` },
      { value: startYear - 4, label: `${startYear - 4}` },
      { value: startYear - 5, label: `${startYear - 5}` },
      { value: startYear - 6, label: `${startYear - 6}` },
      { value: startYear - 7, label: `${startYear - 7}` },
      { value: startYear - 8, label: `${startYear - 8}` },
    ]);
  });
  it('start & stop are zero, returns the year for today', () => {
    const startYear = new Date().getFullYear();
    expect(dateRangeOptions(0, 0)).toEqual([{ value: startYear, label: `${startYear}` }]);
  });
  it('throws when start and stop are different signs', () => {
    expect(() => dateRangeOptions(1, -1)).toThrowError(
      new Error(`Both start (${1}) and stop (${-1}) must both be <= 0 or > 0, got one of each`),
    );
  });
});
