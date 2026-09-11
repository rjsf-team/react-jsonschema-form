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

  it('should leave a value with no offset untouched', () => {
    expect(offsetTimeToLocalTime('14:30:00')).toEqual('14:30:00');
  });

  it('should leave an empty string untouched', () => {
    expect(offsetTimeToLocalTime('')).toEqual('');
  });
});
