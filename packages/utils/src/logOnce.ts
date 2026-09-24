/** The console methods `logOnce()` can log through */
export type LogOnceLevel = 'warn' | 'error';

/** How many distinct messages each scope remembers before forgetting the one seen least recently, so a long-running process (such as a
 * server rendering many different schemas) can't grow the set without bound
 */
export const LOG_ONCE_MAX_MESSAGES = 1000;

// Scopes are held weakly so that the messages remembered for a form are freed along with that form
let loggedMessagesByScope = new WeakMap<object, Set<string>>();
const GLOBAL_SCOPE = {};

// Objects whose content can't be read (a `Map`, a class with private fields) are compared by identity instead, since
// their `JSON.stringify()` form is `{}` and their `String()` form is `[object ...]` whatever they hold
const objectIds = new WeakMap<object, number>();
let nextObjectId = 0;

/** Determines whether `arg` is an `Error`, including one from another realm (an iframe or a Node `vm` context), which
 * `instanceof Error` doesn't recognize
 *
 * @param arg - The object to check
 * @returns - True if `arg` looks like an `Error`
 */
function isErrorLike(arg: object) {
  return arg instanceof Error || Object.prototype.toString.call(arg) === '[object Error]';
}

/** Returns the form of `arg` that `logOnce()` compares: an `Error`'s `String()` form, a plain object or array's
 * `JSON.stringify()` form, any other object's identity, and any other value's `String()` form.
 *
 * @param arg - The value to convert
 * @returns - The comparable form of `arg`
 * @throws - When `arg` can't be converted, such as a circular object or one whose `toString()` throws
 */
function toComparable(arg: unknown) {
  if (typeof arg !== 'object' || arg === null || isErrorLike(arg)) {
    return String(arg);
  }
  const proto = Object.getPrototypeOf(arg);
  if (Array.isArray(arg) || proto === null || proto === Object.prototype) {
    return JSON.stringify(arg);
  }
  let id = objectIds.get(arg);
  if (id === undefined) {
    id = nextObjectId;
    nextObjectId += 1;
    objectIds.set(arg, id);
  }
  // The control character keeps an identity from ever matching a string arg
  return `\u0001${id}`;
}

/** Logs `message` (followed by any `args`) through `console.warn()` or `console.error()`, but only the first time that
 * exact combination of `level`, `message` and `args` is seen within `scope`, so that warnings raised while rendering
 * aren't repeated on every re-render. Passing a per-form object (such as its `schemaUtils`) as the `scope` keeps one
 * form's warning from silencing the same warning about a different form. See `logOnce()` for how `args` are compared.
 *
 * @param scope - The object whose messages are remembered together
 * @param message - The message to log
 * @param [level='warn'] - Which console method to log through
 * @param args - Any additional values to pass to the console method after the `message`
 */
export function logOnceInScope(scope: object, message: string, level: LogOnceLevel = 'warn', ...args: unknown[]) {
  let key: string | undefined;
  try {
    key = [level, message, ...args.map(toComparable)].join('\u0000');
  } catch {
    // Logging must never throw: a caller may be logging from inside a `catch` for a value a user's code threw
  }
  if (key !== undefined) {
    let loggedMessages = loggedMessagesByScope.get(scope);
    if (!loggedMessages) {
      loggedMessages = new Set();
      loggedMessagesByScope.set(scope, loggedMessages);
    }
    if (loggedMessages.delete(key)) {
      // Re-added so that a `Set`, which iterates in insertion order, keeps its least recently seen message first
      loggedMessages.add(key);
      return;
    }
    if (loggedMessages.size >= LOG_ONCE_MAX_MESSAGES) {
      loggedMessages.delete(loggedMessages.values().next().value!);
    }
    loggedMessages.add(key);
  }
  // oxlint-disable-next-line no-console
  console[level](message, ...args);
}

/** Logs `message` (followed by any `args`) through `console.warn()` or `console.error()`, but only the first time that
 * exact combination of `level`, `message` and `args` is seen, so that warnings raised while rendering aren't repeated
 * on every re-render. An `Error` in `args` is compared by its `String()` form, a plain object or array by its
 * `JSON.stringify()` form, and any other object by identity, so distinct errors and payloads still log separately.
 * When one of the `args` can't be converted, the message is always logged, since it can't be told apart from the ones
 * already logged. Only the `LOG_ONCE_MAX_MESSAGES` most recently seen distinct messages are remembered.
 *
 * @param message - The message to log
 * @param [level='warn'] - Which console method to log through
 * @param args - Any additional values to pass to the console method after the `message`
 */
export default function logOnce(message: string, level: LogOnceLevel = 'warn', ...args: unknown[]) {
  logOnceInScope(GLOBAL_SCOPE, message, level, ...args);
}

/** Forgets every message `logOnce()` and `logOnceInScope()` have already logged, so each will be logged again the next
 * time it is seen. Mainly useful for tests, where each test expects its own warnings.
 */
export function resetLogOnce() {
  loggedMessagesByScope = new WeakMap();
}
