import noop from '../src/noop.ts';

describe('noop()', () => {
  it('returns undefined and does nothing', () => {
    expect(noop()).toBeUndefined();
  });
});
