import { parseDateString } from '../src';

describe('parseDateString()', () => {
  it('should raise on invalid JSON datetime', () => {
    expect(() => parseDateString('plop')).toThrowError('Unable to parse');
  });

  it('should return a default object when no datetime is passed', () => {
    expect(parseDateString(undefined)).toEqual({
      year: -1,
      month: -1,
      day: -1,
      hour: -1,
      minute: -1,
      second: -1,
    });
  });

  it('should return a default object when time should not be included', () => {
    expect(parseDateString(undefined, false)).toEqual({
      year: -1,
      month: -1,
      day: -1,
      hour: 0,
      minute: 0,
      second: 0,
    });
  });

  it('should parse a valid JSON datetime string', () => {
    expect(parseDateString('2016-04-05T14:01:30.182Z')).toEqual({
      year: 2016,
      month: 4,
      day: 5,
      hour: 14,
      minute: 1,
      second: 30,
    });
  });

  it('should exclude time when includeTime is false', () => {
    expect(parseDateString('2016-04-05T14:01:30.182Z', false)).toEqual({
      year: 2016,
      month: 4,
      day: 5,
      hour: 0,
      minute: 0,
      second: 0,
    });
  });
});
