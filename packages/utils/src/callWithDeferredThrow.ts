/** Calls `callback`, rethrowing anything it throws from a timer instead of to the caller. A consumer's callback that
 * runs inside React's commit phase, from an Effect or its cleanup, would otherwise unmount everything up to the nearest
 * error boundary. From a timer the throw escapes error boundaries instead: a browser reports it as an uncaught error,
 * the way it reports a throw from a DOM event handler, a test runner as an unhandled error, and Node as an
 * `uncaughtException`.
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
