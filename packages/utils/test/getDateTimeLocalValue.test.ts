import { getDateTimeLocalValue } from '../src/index.ts';

describe('getDateTimeLocalValue()', () => {
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

  it('should strip the offset from a converted epoch number for iso-date-time', () => {
    const epoch = Date.UTC(2020, 4, 3, 14, 30);
    expect(getDateTimeLocalValue({ type: 'string', format: 'iso-date-time' }, epoch).localValue).toEqual(
      '2020-05-03T14:30:00.000',
    );
  });

  it('should strip the offset from a converted Date for iso-date-time', () => {
    const date = new Date(Date.UTC(2020, 4, 3, 14, 30));
    expect(getDateTimeLocalValue({ type: 'string', format: 'iso-date-time' }, date).localValue).toEqual(
      '2020-05-03T14:30:00.000',
    );
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
