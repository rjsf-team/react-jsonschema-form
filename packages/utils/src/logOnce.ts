/** The console methods `logOnce()` can log through */
export type LogOnceLevel = 'warn' | 'error';

/** How many distinct messages each scope remembers before forgetting all of them, so a long-running process (such as a
 * server rendering many different schemas) can't grow the set without bound
 */
export const LOG_ONCE_MAX_MESSAGES = 1000;

// Scopes are held weakly so that the messages remembered for a form are freed along with that form
let loggedMessagesByScope = new WeakMap<object, Set<string>>();
const GLOBAL_SCOPE = {};

/** Logs `message` (followed by `error`, when there is one) through `console.warn()` or `console.error()`, but only the
 * first time that combination of `level`, `message` and `error` is seen within `scope`, so that a warning raised while
 * rendering isn't repeated on every re-render. The `error` is compared by its `String()` form, falling back to its type
 * when that can't be converted. Passing a per-form object (such as its `schemaUtils`) as the `scope` keeps one form's
 * warning from silencing the same warning about a different form.
 *
 * @param message - The message to log
 * @param [level='warn'] - Which console method to log through
 * @param [error] - The error, or any other value, to pass to the console method after the `message`
 * @param [scope] - The object whose messages are remembered together, defaulting to one shared by every caller
 */
export default function logOnce(
  message: string,
  level: LogOnceLevel = 'warn',
  error?: unknown,
  scope: object = GLOBAL_SCOPE,
) {
  let key: string;
  try {
    key = `${level}\u0000${message}\u0000${error === undefined ? '' : String(error)}`;
  } catch {
    // Logging must never throw: `error` came out of a `catch`, so converting it can throw whatever a user's code threw.
    // `typeof` can't throw, and still keeps the message from being logged on every render, at the cost of not telling
    // two unconvertible errors apart. The control character keeps that key from colliding with a converted one.
    key = `${level}\u0000${message}\u0000\u0001${typeof error}`;
  }
  let loggedMessages = loggedMessagesByScope.get(scope);
  if (!loggedMessages) {
    loggedMessages = new Set();
    loggedMessagesByScope.set(scope, loggedMessages);
  }
  if (loggedMessages.has(key)) {
    return;
  }
  if (loggedMessages.size >= LOG_ONCE_MAX_MESSAGES) {
    // Emptying the set costs at worst one more log of a message it had already seen, and keeps this bounded without
    // having to track how recently each message was logged
    loggedMessages.clear();
  }
  loggedMessages.add(key);
  // oxlint-disable-next-line no-console
  console[level](message, ...(error === undefined ? [] : [error]));
}

/** Forgets every message `logOnce()` has already logged, so each will be logged again the next time it is seen. Mainly
 * useful for tests, where each test expects its own warnings.
 */
export function resetLogOnce() {
  loggedMessagesByScope = new WeakMap();
}
