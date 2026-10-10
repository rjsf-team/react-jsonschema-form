import vm from 'node:vm';

import { utcToLocal } from '../src/index.ts';

describe('utcToLocal()', () => {
  const LOCAL_FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/;
  const UTC_DATE = '2016-04-05T00:00:00.000Z';
  const EPOCH = Date.UTC(2020, 4, 3, 14, 30);

  // The local string names the same instant when read back as local time, whatever the time zone of the test run
  const expectInstant = (local: string, epoch: number) => {
    expect(local).toMatch(LOCAL_FORMAT);
    expect(new Date(local).getTime()).toEqual(epoch);
  };

  it('converts a UTC date string', () => {
    expectInstant(utcToLocal(UTC_DATE), Date.parse(UTC_DATE));
  });
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
  it('converts an object whose valueOf() gives an epoch, as moment, dayjs and Luxon objects do', () => {
    expectInstant(utcToLocal({ valueOf: () => EPOCH }), EPOCH);
  });
  it('converts a Date from another realm, which fails instanceof Date', () => {
    const foreignDate: unknown = vm.runInNewContext('new Date(epoch)', { epoch: EPOCH });
    expect(foreignDate).not.toBeInstanceOf(Date);
    expectInstant(utcToLocal(foreignDate), EPOCH);
  });
  it.each([
    ['undefined', undefined],
    ['null', null],
    ['false', false],
    ['true', true],
    ['the bigint 0n', 0n],
    ['a symbol', Symbol('epoch')],
  ])('returns empty string when given %s, which Date reads as the epoch or throws on', (_, value) => {
    expect(utcToLocal(value)).toEqual('');
  });
  it.each([
    ['an empty string', ''],
    ['text that is not a date', 'not-a-date'],
    ['an invalid Date', new Date(NaN)],
    ['an object without a date in it', {}],
    ['an array', [EPOCH]],
    ['a function', () => EPOCH],
  ])('returns empty string when given %s, which does not parse to a valid date', (_, value) => {
    expect(utcToLocal(value)).toEqual('');
  });
  it.each([NaN, Infinity, 8.64e15 + 1])('returns empty string when given the out-of-range number %s', (value) => {
    expect(utcToLocal(value)).toEqual('');
  });
  // `pad()` would otherwise give `-1199-02-15T…` and `00-5-10-17T…`, which `datetime-local` drops
  it.each([-1e14, -62300000000000])(
    'returns empty string when given the valid epoch %s, whose local year is before 1',
    (value) => {
      expect(utcToLocal(value)).toEqual('');
      expect(utcToLocal(new Date(value))).toEqual('');
      expect(utcToLocal(new Date(value).toISOString())).toEqual('');
    },
  );
  it('returns empty string for the year 0, which datetime-local also drops', () => {
    const yearZero = new Date(2000, 6, 1);
    yearZero.setFullYear(0);
    expect(utcToLocal(yearZero)).toEqual('');
    expect(utcToLocal(yearZero.getTime())).toEqual('');
  });
  it('converts the first day of the year 1 and the last day of the year 9999', () => {
    const first = new Date(2000, 0, 1);
    first.setFullYear(1);
    expectInstant(utcToLocal(first), first.getTime());
    const last = new Date(9999, 11, 31, 23, 59, 59, 999);
    expectInstant(utcToLocal(last), last.getTime());
  });
  // Years past 9999 are kept: `datetime-local` takes a year of four or more digits, and browsers go up to 275760
  it.each([Date.UTC(10000, 6, 1), 1e15])('converts the valid epoch %s, whose local year has five digits', (value) => {
    const local = utcToLocal(value);
    expect(local).toMatch(/^\d{5}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}$/);
    // `Date` reads a year of more than four digits only in the six-digit `+YYYYYY` form
    expect(new Date(`+0${local}`).getTime()).toEqual(value);
  });
});
