import { offsetTimeToLocalTime } from '../src/index.ts';

describe('offsetTimeToLocalTime()', () => {
  it('should strip a "Z" suffix', () => {
    expect(offsetTimeToLocalTime('14:30:00Z')).toEqual('14:30:00');
  });

  it('should strip a positive offset suffix', () => {
    expect(offsetTimeToLocalTime('14:30:00+05:30')).toEqual('14:30:00');
  });

  it('should strip a negative offset suffix', () => {
    expect(offsetTimeToLocalTime('14:30:00-04:00')).toEqual('14:30:00');
  });

  it('should strip an offset suffix without a colon', () => {
    expect(offsetTimeToLocalTime('14:30:00-0400')).toEqual('14:30:00');
  });

  it('should strip an hour-only offset suffix with no minutes', () => {
    expect(offsetTimeToLocalTime('14:30:00+05')).toEqual('14:30:00');
  });

  it('should strip an offset suffix after fractional seconds', () => {
    expect(offsetTimeToLocalTime('2020-05-03T10:00:00.123+02:00')).toEqual('2020-05-03T10:00:00.123');
  });

  it('should strip an offset suffix after a time with no seconds', () => {
    expect(offsetTimeToLocalTime('2020-05-03T10:00+02:00')).toEqual('2020-05-03T10:00');
  });

  it('should leave a bare day untouched instead of taking its "-DD" for an offset', () => {
    expect(offsetTimeToLocalTime('2020-05-03')).toEqual('2020-05-03');
  });

  it('should strip an offset suffix after a bare day', () => {
    expect(offsetTimeToLocalTime('2020-05-03+02:00')).toEqual('2020-05-03');
  });

  it('should leave a value with no offset untouched', () => {
    expect(offsetTimeToLocalTime('14:30:00')).toEqual('14:30:00');
  });

  it('should leave an empty string untouched', () => {
    expect(offsetTimeToLocalTime('')).toEqual('');
  });
});
