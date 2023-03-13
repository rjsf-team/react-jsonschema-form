import { utcToLocal } from '../src';

const UTC_DATE = '2016-04-05T00:00:00.000Z';
const EXPECTED_DATE = '2016-04-05T02:00:00.000';

describe('utcToLocal()', () => {
  let getDateSpy: jest.SpyInstance;
  let getHoursSpy: jest.SpyInstance;
  beforeAll(() => {
    const date = new Date(UTC_DATE);
    // Deal with timezone issues by futzing with the getDate() function to return the UTCDate
    getDateSpy = jest.spyOn(global.Date.prototype, 'getDate').mockImplementation(() => date.getUTCDate());
    // Deal with timezone issues by futzing with the getHours() function to return the UTCHours + 2
    getHoursSpy = jest.spyOn(global.Date.prototype, 'getHours').mockImplementation(() => date.getUTCHours() + 2);
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
