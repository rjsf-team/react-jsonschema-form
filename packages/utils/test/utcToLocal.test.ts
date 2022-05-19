import { utcToLocal } from '../src';

describe('utcToLocal()', () => {
  it('returns empty string when given empty string', () => {
    expect(utcToLocal('')).toEqual('');
  });
  it('return local date when passed UTC', () => {
    expect(utcToLocal('2016-04-05T00:00:00.000Z')).toEqual('2016-04-04T17:00:00.000');
  });
});
