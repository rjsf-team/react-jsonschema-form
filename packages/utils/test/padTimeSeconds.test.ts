import { padTimeSeconds } from '../src/index.ts';

describe('padTimeSeconds()', () => {
  it('should append seconds to a bare time missing them', () => {
    expect(padTimeSeconds('11:10')).toEqual('11:10:00');
  });

  it('should leave a bare time with seconds unchanged', () => {
    expect(padTimeSeconds('11:10:30')).toEqual('11:10:30');
  });

  it('should append seconds to a date-time missing them', () => {
    expect(padTimeSeconds('2024-01-01T10:30')).toEqual('2024-01-01T10:30:00');
  });

  it('should leave a date-time with seconds unchanged', () => {
    expect(padTimeSeconds('2024-01-01T10:30:15')).toEqual('2024-01-01T10:30:15');
  });
});
