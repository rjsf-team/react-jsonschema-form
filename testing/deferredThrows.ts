/** Catches what `callWithDeferredThrow()` rethrows from a timer. Node, not jsdom, runs that timer, so its throw would
 * otherwise fail the run as an uncaught exception instead of reaching an assertion.
 *
 * `setTimeout` is put back when the test finishes, however it ends: left in place, the stub would go on catching every
 * timer throw in the tests after it, React's own included.
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
  // Stubbed back to the real one rather than `vi.unstubAllGlobals()`, which would also undo the test's own stubs
  const restore = () => {
    vi.stubGlobal('setTimeout', realSetTimeout);
  };
  onTestFinished(restore);
  const settle = async () => {
    await new Promise((resolve) => {
      realSetTimeout(resolve);
    });
    restore();
  };
  return { thrown, settle };
}
