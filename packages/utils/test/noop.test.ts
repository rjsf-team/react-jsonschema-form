import noop from '../src/noop';

describe('noop()', () => {
  it('returns undefined and does nothing', () => {
    expect(noop()).toBeUndefined();
  });
});
