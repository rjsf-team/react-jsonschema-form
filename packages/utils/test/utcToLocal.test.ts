import type { MockInstance } from 'vitest';

import { utcToLocal } from '../src/index.ts';

const UTC_DATE = '2016-04-05T00:00:00.000Z';
const EXPECTED_DATE = '2016-04-05T02:00:00.000';

describe('utcToLocal()', () => {
  let getDateSpy: MockInstance;
  let getHoursSpy: MockInstance;
  beforeAll(() => {
    const date = new Date(UTC_DATE);
    // Deal with timezone issues by futzing with the getDate() function to return the UTCDate
    getDateSpy = vi.spyOn(global.Date.prototype, 'getDate').mockImplementation(() => date.getUTCDate());
    // Deal with timezone issues by futzing with the getHours() function to return the UTCHours + 2
    getHoursSpy = vi.spyOn(global.Date.prototype, 'getHours').mockImplementation(() => date.getUTCHours() + 2);
  });
  afterAll(() => {
    getDateSpy.mockRestore();
    getHoursSpy.mockRestore();
  });
  it('returns empty string when given empty string', () => {
    expect(utcToLocal('')).toEqual('');
  });
  it('return local date when passed UTC', () => {
    const value = utcToLocal(UTC_DATE);
    expect(value).toEqual(EXPECTED_DATE);
  });
});

describe('utcToLocal() with epoch numbers, Dates and invalid input', () => {
  const LOCAL_FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/;
  const EPOCH = Date.UTC(2020, 4, 3, 14, 30);

  // The local string names the same instant when read back as local time, whatever the time zone of the test run
  const expectInstant = (local: string, epoch: number) => {
    expect(local).toMatch(LOCAL_FORMAT);
    expect(new Date(local).getTime()).toEqual(epoch);
  };

  it('converts an epoch number', () => {
    expectInstant(utcToLocal(EPOCH), EPOCH);
  });
  it('converts an epoch of 0 rather than treating it as no value', () => {
    expectInstant(utcToLocal(0), 0);
  });
  it('converts a Date', () => {
    expectInstant(utcToLocal(new Date(EPOCH)), EPOCH);
  });
  it('converts a Date holding epoch 0', () => {
    expectInstant(utcToLocal(new Date(0)), 0);
  });
  it('returns the same result for an epoch number and the Date holding it', () => {
    expect(utcToLocal(0)).toEqual(utcToLocal(new Date(0)));
  });
  it.each([
    ['undefined', undefined],
    ['null', null],
    ['false', false],
    ['true', true],
    ['the bigint 0n', 0n],
    ['an object', {}],
    ['an array', [EPOCH]],
  ])('returns empty string when given %s, which is not a string, a number or a Date', (_, value) => {
    expect(utcToLocal(value)).toEqual('');
  });
  it('returns empty string when given an empty string', () => {
    expect(utcToLocal('')).toEqual('');
  });
  it('returns empty string when given an invalid Date', () => {
    expect(utcToLocal(new Date(NaN))).toEqual('');
  });
  it.each([NaN, Infinity, 8.64e15 + 1])('returns empty string when given the out-of-range number %s', (value) => {
    expect(utcToLocal(value)).toEqual('');
  });
  // `pad()` would otherwise give `33658-09-27T…`, `-1199-02-15T…` and `00-5-10-17T…`, which `datetime-local` drops
  it.each([1e15, -1e14, -62300000000000])(
    'returns empty string when given the valid epoch %s, whose local year is outside 0-9999',
    (value) => {
      expect(utcToLocal(value)).toEqual('');
      expect(utcToLocal(new Date(value))).toEqual('');
      expect(utcToLocal(new Date(value).toISOString())).toEqual('');
    },
  );
  it('converts the first and last days of the years 0-9999', () => {
    const first = new Date(0, 0, 1);
    first.setFullYear(0);
    expectInstant(utcToLocal(first), first.getTime());
    const last = new Date(9999, 11, 31, 23, 59, 59, 999);
    expectInstant(utcToLocal(last), last.getTime());
  });
  it('returns empty string when given text that is not a date', () => {
    expect(utcToLocal('not-a-date')).toEqual('');
  });
});
