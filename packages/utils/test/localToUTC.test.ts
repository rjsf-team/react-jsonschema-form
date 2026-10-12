import { localToUTC, utcToLocal } from '../src/index.ts';

describe('localToUTC()', () => {
  it.each([
    ['an empty string', ''],
    ['undefined, the emptyValue a cleared BaseInputTemplate hands over', undefined],
    ['null, an emptyValue that is set to null', null],
  ])('returns undefined when passed %s', (_, value) => {
    expect(localToUTC(value as string)).toBeUndefined();
  });
  it('returns UTC version of date when passed date', () => {
    expect(localToUTC('2016-04-05')).toEqual('2016-04-05T00:00:00.000Z');
  });
  // A `datetime-local` input writes `yyyy-MM-ddThh:mm`, with `:ss` or `:ss.SSS` when they aren't zero
  it.each([
    ['2016-04-05T10:20', new Date(2016, 3, 5, 10, 20)],
    ['2016-04-05T10:20:30', new Date(2016, 3, 5, 10, 20, 30)],
    ['2016-04-05T10:20:30.123', new Date(2016, 3, 5, 10, 20, 30, 123)],
    ['0999-01-01T00:00', new Date(999, 0, 1)],
  ])('converts the local wall-clock value %s as Date reads it', (value, date) => {
    expect(localToUTC(value)).toEqual(date.toJSON());
  });
  // A `datetime-local` input writes a year of five or six digits as plain digits, which `Date` reads only behind a
  // sign, as the six-digit `+YYYYYY`
  it.each([
    ['10000-07-01T00:01', new Date(10000, 6, 1, 0, 1)],
    ['10000-07-01T00:01:02', new Date(10000, 6, 1, 0, 1, 2)],
    ['10000-07-01T00:01:02.345', new Date(10000, 6, 1, 0, 1, 2, 345)],
    ['275760-01-01T00:00', new Date(275760, 0, 1)],
    ['100000-01-01T00:00:01.5', new Date(100000, 0, 1, 0, 0, 1, 500)],
    ['275760-09-12T00:00:00.000', new Date(275760, 8, 12)],
  ])('converts the local wall-clock value %s, whose year Date alone reads as invalid', (value, date) => {
    expect(new Date(value).getTime()).toBeNaN();
    expect(localToUTC(value)).toEqual(date.toJSON());
  });
  it('converts a year already written in the signed six-digit form as it is', () => {
    expect(localToUTC('+010000-07-01T00:01')).toEqual(new Date(10000, 6, 1, 0, 1).toJSON());
  });
  it.each([9999, 10000, 275760])('gives back the instant utcToLocal() showed for a local year %s', (year) => {
    const epoch = new Date(year, 6, 1, 12, 30, 15, 500).getTime();
    expect(localToUTC(utcToLocal(epoch))).toEqual(new Date(epoch).toJSON());
  });
  // A JS caller can hand over a number or a Date, which `Date` reads as an epoch or a copy of itself
  it.each([
    ['a number', 1e15],
    ['a Date', new Date(2016, 3, 5, 10, 20)],
  ])('passes %s to Date as it is', (_, value) => {
    // A number or a Date isn't a `string`, though the parameter says so
    expect(localToUTC(value as unknown as string)).toEqual(new Date(value).toJSON());
  });
  it.each([
    ['a Date that is invalid', new Date(NaN)],
    ['an object that is not a date', {}],
  ])('returns null for %s', (_, value) => {
    expect(localToUTC(value as unknown as string)).toBeNull();
  });
  it.each([
    ['text that is not a date', 'not-a-date'],
    ['a year of seven digits, which no datetime-local input writes and Date cannot read', '1234567-01-01T00:00'],
  ])('returns null, what toJSON() gives an invalid date, for %s', (_, value) => {
    expect(new Date(value).getTime()).toBeNaN();
    expect(localToUTC(value)).toBeNull();
  });
});
