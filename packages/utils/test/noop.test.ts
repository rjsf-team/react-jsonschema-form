import noop from '../src/noop.js';

describe('noop()', () => {
  it('returns undefined and does nothing', () => {
    expect(noop()).toBeUndefined();
  });
});
