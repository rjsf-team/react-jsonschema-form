/** Catches what `callWithDeferredThrow()` rethrows from a timer. Node, not jsdom, runs that timer, so its throw would
 * otherwise fail the run as an uncaught exception instead of reaching an assertion.
 *
 * @returns - The errors caught so far, and a function that waits for pending timers and restores `setTimeout`
 */
export function collectDeferredThrows() {
  const thrown: unknown[] = [];
  const realSetTimeout = setTimeout;
  vi.stubGlobal('setTimeout', (callback: () => void, delay?: number) =>
    realSetTimeout(() => {
      try {
        callback();
      } catch (error) {
        thrown.push(error);
      }
    }, delay),
  );
  const settle = async () => {
    await new Promise((resolve) => {
      realSetTimeout(resolve);
    });
    vi.unstubAllGlobals();
  };
  return { thrown, settle };
}
