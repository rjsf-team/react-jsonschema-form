import getDateElementProps from '../src/getDateElementProps.ts';
import { isDateElementFormat, normalizeYearsRange } from '../src/index.ts';

describe('getDateElementProps', () => {
  const monthRange = [1, 12];
  const dayRange = [1, 31];
  const defaultYearRange = [1900, new Date().getFullYear() + 2] as [number, number];

  it('gives a part the date holds as -1 an undefined value, and a part of 0 its 0', () => {
    const date = { day: -1, month: 12, year: -1, hour: 0, minute: -1, second: 0 };

    const prop = getDateElementProps(date, true);

    expect(prop).toEqual([
      { type: 'year', range: defaultYearRange, value: undefined },
      { type: 'month', range: monthRange, value: 12 },
      { type: 'day', range: dayRange, value: undefined },
      { type: 'hour', range: [0, 23], value: 0 },
      { type: 'minute', range: [0, 59], value: undefined },
      { type: 'second', range: [0, 59], value: 0 },
    ]);
  });

  it('returns date in default(YMD) format when time is false and format is not passed', () => {
    const date = { day: 11, month: 12, year: 2023 };

    const prop = getDateElementProps(date, false);

    expect(prop).toEqual([
      { type: 'year', range: defaultYearRange, value: date.year },
      { type: 'month', range: monthRange, value: date.month },
      { type: 'day', range: dayRange, value: date.day },
    ]);
  });

  it('returns date in YMD format when time is not false', () => {
    const date = { day: 11, month: 12, year: 2003 };
    const yearRange = [1950, 2010] as [number, number];

    const prop = getDateElementProps(date, false, yearRange, 'YMD');

    expect(prop).toEqual([
      { type: 'year', range: yearRange, value: date.year },
      { type: 'month', range: monthRange, value: date.month },
      { type: 'day', range: dayRange, value: date.day },
    ]);
  });

  it("returns date in 'MDY' format when time is false and format is not passed", () => {
    const date = { day: 21, month: 10, year: 2021 };
    const yearRange = [2000, 2024] as [number, number];

    const prop = getDateElementProps(date, false, yearRange, 'MDY');

    expect(prop).toEqual([
      { type: 'month', range: monthRange, value: date.month },
      { type: 'day', range: dayRange, value: date.day },
      { type: 'year', range: yearRange, value: date.year },
    ]);
  });

  it("returns date in 'DMY' format when time is false and format is not passed", () => {
    const date = { day: 1, month: 7, year: 2017 };
    const yearRange = [2010, 2025] as [number, number];

    const prop = getDateElementProps(date, false, yearRange, 'DMY');

    expect(prop).toEqual([
      { type: 'day', range: dayRange, value: date.day },
      { type: 'month', range: monthRange, value: date.month },
      { type: 'year', range: yearRange, value: date.year },
    ]);
  });

  it("returns date in 'YMD' format with time when format is not specified", () => {
    const date = { day: 13, month: 10, year: 2003, hour: 12, minute: 45, second: 18 };

    const prop = getDateElementProps(date, true);

    expect(prop).toEqual([
      { type: 'year', range: defaultYearRange, value: date.year },
      { type: 'month', range: monthRange, value: date.month },
      { type: 'day', range: dayRange, value: date.day },
      { type: 'hour', range: [0, 23], value: date.hour },
      { type: 'minute', range: [0, 59], value: date.minute },
      { type: 'second', range: [0, 59], value: date.second },
    ]);
  });

  it("returns date in 'DMY' format with time when format is not specified", () => {
    const date = { day: 13, month: 10, year: 2003, hour: 12, minute: 45, second: 18 };

    const prop = getDateElementProps(date, true, undefined, 'DMY');

    expect(prop).toEqual([
      { type: 'day', range: dayRange, value: date.day },
      { type: 'month', range: monthRange, value: date.month },
      { type: 'year', range: defaultYearRange, value: date.year },
      { type: 'hour', range: [0, 23], value: date.hour },
      { type: 'minute', range: [0, 59], value: date.minute },
      { type: 'second', range: [0, 59], value: date.second },
    ]);
  });

  it("returns date in 'MDY' format with time when format is not specified", () => {
    const date = { day: 13, month: 10, year: 2003, hour: 12, minute: 45, second: 18 };
    const yearRange = [1999, 2023] as [number, number];

    const prop = getDateElementProps(date, true, yearRange, 'MDY');

    expect(prop).toEqual([
      { type: 'month', range: monthRange, value: date.month },
      { type: 'day', range: dayRange, value: date.day },
      { type: 'year', range: yearRange, value: date.year },
      { type: 'hour', range: [0, 23], value: date.hour },
      { type: 'minute', range: [0, 59], value: date.minute },
      { type: 'second', range: [0, 59], value: date.second },
    ]);
  });
});

describe('isDateElementFormat()', () => {
  it.each(['DMY', 'MDY', 'YMD'])('accepts %s', (format) => {
    expect(isDateElementFormat(format)).toBe(true);
  });
  it.each([
    ['another string', 'hex'],
    ['undefined', undefined],
    ['a number', 1],
  ])('rejects %s', (_, format) => {
    expect(isDateElementFormat(format)).toBe(false);
  });
});

describe('normalizeYearsRange()', () => {
  it('keeps two years of the same kind', () => {
    expect(normalizeYearsRange([1990, 2030])).toEqual([1990, 2030]);
    expect(normalizeYearsRange([-10, 0])).toEqual([-10, 0]);
    expect(normalizeYearsRange([0, 2])).toEqual([0, 2]);
  });
  it('reads a year held as a numeric string as its number', () => {
    expect(normalizeYearsRange(['1990', '2030'])).toEqual([1990, 2030]);
  });
  it('rounds a fractional year down', () => {
    expect(normalizeYearsRange([1990.5, 1992.5])).toEqual([1990, 1992]);
  });
  it('keeps a span of ten thousand years', () => {
    expect(normalizeYearsRange([800, 2030])).toEqual([800, 2030]);
    expect(normalizeYearsRange([-10000, 0])).toEqual([-10000, 0]);
  });
  it('keeps entries after the first two', () => {
    expect(normalizeYearsRange([1990, 2030, 'junk'])).toEqual([1990, 2030]);
  });
  it.each([
    ['undefined', undefined],
    ['a number', 2000],
    ['one entry', [1990]],
    ['a year that is not a number', [1990, 'soon']],
    ['a relative and an absolute year', [-10, 2030]],
    ['a span of more than ten thousand years', [0, 10001]],
    ['a span of a billion years', [1, 1e9]],
    ['years too large to count one by one', [1e16, 1e16]],
    ['years too large to count one by one as numeric strings', ['10000000000000000', '10000000000000000']],
  ])('gives undefined for %s', (_, yearsRange) => {
    expect(normalizeYearsRange(yearsRange)).toBeUndefined();
  });
});
