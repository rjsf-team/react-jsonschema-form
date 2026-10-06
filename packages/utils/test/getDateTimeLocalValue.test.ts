import { getDateTimeLocalValue } from '../src/index.ts';

describe('getDateTimeLocalValue()', () => {
  // Mirrors packages/daisyui/test/helpers/pinTimeZone.ts: the non date-time cases below depend on the local zone
  const realTZ = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = 'America/Los_Angeles';
  });
  afterAll(() => {
    if (realTZ === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = realTZ;
    }
  });

  it('should report isIsoDateTime as false for format=date-time', () => {
    expect(getDateTimeLocalValue({ type: 'string', format: 'date-time' }, undefined).isIsoDateTime).toBe(false);
  });

  it('should report isIsoDateTime as true for format=iso-date-time', () => {
    expect(getDateTimeLocalValue({ type: 'string', format: 'iso-date-time' }, undefined).isIsoDateTime).toBe(true);
  });

  it('should normalize an undefined value to undefined for localValue', () => {
    expect(getDateTimeLocalValue({ type: 'string', format: 'iso-date-time' }, undefined).localValue).toBeUndefined();
  });

  it.each([true, null, {}, [], Symbol('x')])('should normalize %s to undefined for localValue', (value) => {
    expect(getDateTimeLocalValue({ type: 'string', format: 'date-time' }, value).localValue).toBeUndefined();
  });

  it('should convert an epoch number to an ISO string for localValue', () => {
    const epoch = Date.UTC(2020, 4, 3, 14, 30);
    expect(getDateTimeLocalValue({ type: 'string', format: 'date-time' }, epoch).localValue).toEqual(
      '2020-05-03T14:30:00.000Z',
    );
  });

  it('should convert a Date to an ISO string for localValue', () => {
    const date = new Date(Date.UTC(2020, 4, 3, 14, 30));
    expect(getDateTimeLocalValue({ type: 'string', format: 'date-time' }, date).localValue).toEqual(
      '2020-05-03T14:30:00.000Z',
    );
  });

  it('should show a converted epoch number at local wall-clock time for iso-date-time', () => {
    const epoch = Date.UTC(2020, 4, 3, 14, 30);
    expect(getDateTimeLocalValue({ type: 'string', format: 'iso-date-time' }, epoch).localValue).toEqual(
      '2020-05-03T07:30:00.000',
    );
  });

  it('should show a converted Date at local wall-clock time for iso-date-time', () => {
    const date = new Date(Date.UTC(2020, 4, 3, 14, 30));
    expect(getDateTimeLocalValue({ type: 'string', format: 'iso-date-time' }, date).localValue).toEqual(
      '2020-05-03T07:30:00.000',
    );
  });

  it.each([
    ['no format', {}],
    ['format: date', { format: 'date' }],
  ])('should show a converted epoch number and Date at local wall-clock time for %s', (_name, extra) => {
    const schema = { type: 'string', ...extra } as const;
    const epoch = Date.UTC(2020, 4, 3, 2, 0);
    expect(getDateTimeLocalValue(schema, epoch).localValue).toEqual('2020-05-02T19:00:00.000');
    expect(getDateTimeLocalValue(schema, new Date(epoch)).localValue).toEqual('2020-05-02T19:00:00.000');
  });

  it('should read a UTC midnight as the day it names for format=date', () => {
    const schema = { type: 'string', format: 'date' } as const;
    const epoch = Date.UTC(2020, 4, 3);
    expect(getDateTimeLocalValue(schema, epoch).localValue).toEqual('2020-05-03');
    expect(getDateTimeLocalValue(schema, new Date(epoch)).localValue).toEqual('2020-05-03');
  });

  it.each([Date.UTC(10000, 0, 1), Date.UTC(-3, 0, 1)])(
    'should normalize the UTC midnight %s outside the years 0-9999 to undefined for format=date',
    (value) => {
      expect(getDateTimeLocalValue({ type: 'string', format: 'date' }, value).localValue).toBeUndefined();
    },
  );

  it('should not read a UTC midnight as a day for a format other than date', () => {
    const epoch = Date.UTC(2020, 4, 3);
    expect(getDateTimeLocalValue({ type: 'string' }, epoch).localValue).toEqual('2020-05-02T17:00:00.000');
  });

  it.each([8.64e15, Date.UTC(-3, 0, 1)])(
    'should normalize the epoch %s with a local year outside 0-9999 to undefined',
    (value) => {
      expect(getDateTimeLocalValue({ type: 'string' }, value).localValue).toBeUndefined();
    },
  );

  it.each([
    ['date-time', true],
    ['datetime', true],
    ['iso-date-time', false],
    ['date', false],
    [undefined, false],
  ])('should report requiresOffset for format=%s as %s', (format, expected) => {
    expect(getDateTimeLocalValue({ type: 'string', format }, '2020-05-03').requiresOffset).toBe(expected);
  });

  it.each([NaN, Infinity, 8.64e15 + 1])('should normalize the out-of-range number %s to undefined', (value) => {
    expect(getDateTimeLocalValue({ type: 'string', format: 'date-time' }, value).localValue).toBeUndefined();
  });

  it('should normalize an invalid Date to undefined for localValue', () => {
    expect(getDateTimeLocalValue({ type: 'string', format: 'date-time' }, new Date(NaN)).localValue).toBeUndefined();
  });

  it('should leave a string value untouched when format is not iso-date-time', () => {
    const value = '2016-04-05T14:01:30.000Z';
    expect(getDateTimeLocalValue({ type: 'string', format: 'date-time' }, value).localValue).toEqual(value);
  });

  it('should strip a timezone offset from a string value for iso-date-time', () => {
    expect(
      getDateTimeLocalValue({ type: 'string', format: 'iso-date-time' }, '2016-04-05T14:01:30.000Z').localValue,
    ).toEqual('2016-04-05T14:01:30.000');
  });

  it('should leave a string value without a timezone offset untouched for iso-date-time', () => {
    const value = '2016-04-05T14:01:30';
    expect(getDateTimeLocalValue({ type: 'string', format: 'iso-date-time' }, value).localValue).toEqual(value);
  });
});
