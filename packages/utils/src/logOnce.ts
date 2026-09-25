/** The console methods `logOnce()` can log through */
export type LogOnceLevel = 'warn' | 'error';

/** How many distinct messages are remembered before new ones stop being remembered, so a long-running process (such as
 * a server rendering many different schemas) can't grow the set without bound
 */
export const LOG_ONCE_MAX_MESSAGES = 1000;

const loggedMessages = new Set<string>();

/** Logs `message` (followed by `error`, when there is one) through `console.warn()` or `console.error()`, but only the
 * first time that combination of `level`, `message` and `error` is seen, so that a warning raised while rendering isn't
 * repeated on every re-render. The `error` is compared by its `String()` form, falling back to its type when that can't
 * be converted, so two distinct values with the same string (two plain objects, say, which are both `[object Object]`)
 * are treated as one message. A message that has to be told apart from another must say so itself: the field warnings
 * name the field, and the `dependencies` `oneOf` warning names the key.
 *
 * @param message - The message to log
 * @param [level='warn'] - Which console method to log through
 * @param [error] - The error, or any other value, to pass to the console method after the `message`
 */
export default function logOnce(message: string, level: LogOnceLevel = 'warn', error?: unknown) {
  let key: string;
  try {
    // The control characters keep these three cases apart: no error at all, an error that converted (so `logOnce(m)`
    // and `logOnce(m, 'warn', '')` are two messages), and one that didn't
    key = error === undefined ? `${level}\u0000${message}` : `${level}\u0000${message}\u0000\u0002${String(error)}`;
  } catch {
    // Logging must never throw: `error` came out of a `catch`, so converting it can throw whatever a user's code threw.
    // `typeof` can't throw, and still keeps the message from being logged on every render, at the cost of not telling
    // two unconvertible errors apart.
    key = `${level}\u0000${message}\u0000\u0001${typeof error}`;
  }
  if (loggedMessages.has(key)) {
    return;
  }
  // Past the cap a message is logged but not remembered, so it repeats. Clearing the set instead would un-remember
  // every message already in it, and a render producing more distinct messages than the cap would then empty it on
  // every pass, logging all of them every time — the flood this exists to prevent.
  if (loggedMessages.size < LOG_ONCE_MAX_MESSAGES) {
    loggedMessages.add(key);
  }
  // oxlint-disable-next-line no-console
  console[level](message, ...(error === undefined ? [] : [error]));
}

/** Forgets every message `logOnce()` has already logged, so each will be logged again the next time it is seen. Mainly
 * useful for tests, where each test expects its own warnings.
 */
export function resetLogOnce() {
  loggedMessages.clear();
}
