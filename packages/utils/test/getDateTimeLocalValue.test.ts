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

  it('should normalize a non-string value to undefined for localValue', () => {
    expect(getDateTimeLocalValue({ type: 'string', format: 'date-time' }, 12345).localValue).toBeUndefined();
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
