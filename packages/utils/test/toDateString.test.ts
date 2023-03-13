import { toDateString } from '../src';

describe('toDateString()', () => {
  it('should transform an object to a valid json datetime if time=true', () => {
    expect(
      toDateString({
        year: 2016,
        month: 4,
        day: 5,
        hour: 14,
        minute: 1,
        second: 30,
      })
    ).toEqual('2016-04-05T14:01:30.000Z');
  });

  it('should transform an object to a valid date string if time=false', () => {
    expect(
      toDateString(
        {
          year: 2016,
          month: 4,
          day: 5,
        },
        false
      )
    ).toEqual('2016-04-05');
  });
});
