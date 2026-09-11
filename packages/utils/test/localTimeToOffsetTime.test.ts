import { localTimeToOffsetTime } from '../src/index.ts';

describe('localTimeToOffsetTime()', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should suffix with "Z" when the local offset is UTC', () => {
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(0);
    expect(localTimeToOffsetTime('14:30:00')).toEqual('14:30:00Z');
  });

  it('should suffix with a positive offset when local time is ahead of UTC', () => {
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-330);
    expect(localTimeToOffsetTime('14:30:00')).toEqual('14:30:00+05:30');
  });

  it('should suffix with a negative offset when local time is behind UTC', () => {
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(240);
    expect(localTimeToOffsetTime('14:30:00')).toEqual('14:30:00-04:00');
  });

  it('should leave the wall-clock value untouched', () => {
    vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(60);
    expect(localTimeToOffsetTime('09:00')).toEqual('09:00-01:00');
  });
});
