/** Calls `callback`, rethrowing anything it throws from a timer instead of to the caller. A consumer's callback that
 * runs inside React's commit phase, from an Effect or its cleanup, would otherwise unmount everything up to the nearest
 * error boundary; from a timer the error reaches the page the way it would from a DOM event handler.
 *
 * @param callback - The consumer's callback to call
 */
export default function callWithDeferredThrow(callback: () => void) {
  try {
    callback();
  } catch (error) {
    setTimeout(() => {
      throw error;
    });
  }
}
