/** Catches what `callWithDeferredThrow()` rethrows from a timer. Node, not jsdom, runs that timer, so its throw would
 * otherwise fail the run as an uncaught exception instead of reaching an assertion.
 *
 * @returns - The errors caught so far, and a function that waits for pending timers and restores `setTimeout`
 */
export function collectDeferredThrows() {
  const thrown: unknown[] = [];
  const realSetTimeout = setTimeout;
  vi.stubGlobal('setTimeout', (callback: (...args: unknown[]) => void, delay?: number, ...args: unknown[]) =>
    realSetTimeout(() => {
      try {
        callback(...args);
      } catch (error) {
        thrown.push(error);
      }
    }, delay),
  );
  const settle = async () => {
    await new Promise((resolve) => {
      realSetTimeout(resolve);
    });
    // Only this stub is undone, so a test can combine this helper with stubs of its own
    vi.stubGlobal('setTimeout', realSetTimeout);
  };
  return { thrown, settle };
}
