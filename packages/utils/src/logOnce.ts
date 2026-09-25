/** The console methods `logOnce()` can log through */
export type LogOnceLevel = 'warn' | 'error';

/** How many distinct messages are remembered before the oldest generation of them is dropped, so a long-running
 * process (such as a server rendering many different schemas) can't grow the set without bound. Deduping holds for a
 * working set of up to twice this and then stops abruptly: a render producing more distinct messages than that logs
 * every one of them on every pass, because no message survives long enough to be seen a second time. That edge is why
 * the number is larger than the mistakes a form could plausibly contain — the warnings are raised per field, not per
 * mistake, so an array of a thousand rows whose item schema is misconfigured twice is two thousand distinct messages.
 * The memory is only spent by a form that actually produces that many, since this is a ceiling and not an allocation:
 * two full generations of the longest message logged here stays under a megabyte, and a form warning about a handful
 * of fields holds a handful of strings.
 */
export const LOG_ONCE_MAX_MESSAGES = 2000;

/** What has been logged is kept in two generations rather than one set: when `currentMessages` fills it becomes
 * `previousMessages` and a fresh one takes its place, so a message is still remembered for at least
 * `LOG_ONCE_MAX_MESSAGES` further distinct messages after it is first seen, and memory stays bounded at twice that.
 * The alternatives both bring back the every-render flood this exists to prevent, and bring it back at a far smaller
 * working set: clearing at the cap un-remembers every message at once, so a render producing more distinct messages
 * than the cap empties it on every pass and logs all of them every time; keeping the first `LOG_ONCE_MAX_MESSAGES` and
 * remembering nothing after means that once the cap has filled with messages that never recur — a per-row id or index,
 * or another tenant's form under SSR — every message first seen after that point logs on every render for the rest of
 * the process's life.
 */
let currentMessages = new Set<string>();
let previousMessages = new Set<string>();

/** Logs `message` (followed by `error`, when there is one) through `console.warn()` or `console.error()`, but only the
 * first time that combination of `level`, `message` and `error` is seen, so that a warning raised while rendering isn't
 * repeated on every re-render. The `error` is compared by its `String()` form, falling back to its type when that can't
 * be converted, so two distinct values with the same string (two plain objects, say, which are both `[object Object]`)
 * are treated as one message. A message that has to be told apart from another must say so itself, as the field
 * warnings do by naming the field; one that identifies nothing, or only something as generic as a `dependencies` key,
 * is reported for whichever schema reaches it first and stays silent for the rest until the page is reloaded.
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
  // A message found in `previousMessages` is deliberately left there rather than promoted into `currentMessages`, so
  // one seen on every render is logged a second time once two rotations have displaced it. Promoting it would keep it
  // forever, but every such message would then hold a slot in the current generation too, collapsing how large a
  // working set stays deduped: the largest one that survives today, of exactly twice the cap, would go from one log
  // per message to one log per pass.
  if (currentMessages.has(key) || previousMessages.has(key)) {
    return;
  }
  if (currentMessages.size >= LOG_ONCE_MAX_MESSAGES) {
    previousMessages = currentMessages;
    currentMessages = new Set();
  }
  currentMessages.add(key);
  // `level` is only type-checked, so a JS caller can pass anything; `console[level]` would throw inside the very
  // render that was trying to warn, and the key is already remembered by then, so the message would never log at all
  // oxlint-disable-next-line no-console
  (level === 'error' ? console.error : console.warn)(message, ...(error === undefined ? [] : [error]));
}

/** Forgets every message `logOnce()` has already logged, so each will be logged again the next time it is seen. Mainly
 * useful for tests, where each test expects its own warnings.
 */
export function resetLogOnce() {
  currentMessages.clear();
  previousMessages.clear();
}
