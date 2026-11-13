import { callWithDeferredThrow } from '../src/index.ts';

describe('callWithDeferredThrow()', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls the callback synchronously', () => {
    const callback = vi.fn();
    callWithDeferredThrow(callback);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('rethrows from a timer instead of to the caller', () => {
    vi.useFakeTimers();
    const boom = new Error('boom');
    expect(() =>
      callWithDeferredThrow(() => {
        throw boom;
      }),
    ).not.toThrow();
    expect(() => vi.runAllTimers()).toThrow(boom);
  });
});
