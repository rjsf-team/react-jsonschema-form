import { localToUTC } from '../src';

describe('localToUTC()', () => {
  it('returns undefined when passed empty string', () => {
    expect(localToUTC('')).toBeUndefined();
  });
  it('returns UTC version of date when passed date', () => {
    expect(localToUTC('2016-04-05')).toEqual('2016-04-05T00:00:00.000Z');
  });
});
