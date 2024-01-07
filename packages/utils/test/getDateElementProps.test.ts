import getDateElementProps from '../src/getDateElementProps';

describe('getDateElementProps', () => {
  const monthRange = [1, 12];
  const dayRange = [1, 31];
  const defaultYearRange = [1900, new Date().getFullYear() + 2] as [number, number];

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
