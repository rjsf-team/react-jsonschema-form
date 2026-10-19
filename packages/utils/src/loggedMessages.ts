/** The messages `logOnce()` and the override warnings have logged. Internal to `@rjsf/utils`: `package.json` excludes
 * this module from the `./lib/*.js` exports wildcard so it can't be deep-imported. `resetLogOnce()` clears it.
 */

/** How many distinct messages are remembered before the oldest generation of them is dropped, so a long-running
 * process (such as a server rendering many different schemas) can't grow the set without bound. Deduping holds for a
 * working set of up to twice this and then stops abruptly: a render producing more distinct messages than that logs
 * every one of them on every pass, because no message survives long enough to be seen a second time. That edge is why
 * the number is larger than the mistakes a form could plausibly contain — the warnings are raised per field, not per
 * mistake, so an array of a thousand rows whose item schema is misconfigured twice is two thousand distinct messages.
 * What is bounded is the number of remembered messages, at twice this; how much memory they take follows what callers
 * pass, since a remembered message holds the `message` and the string form of the `error`, both of which can carry
 * arbitrary text, and a plain-object or array `error` is held as its whole JSON. Two full generations of the warnings
 * raised inside this library, which run a few hundred bytes each, stay under a megabyte. The cap is a ceiling rather
 * than an allocation, so a form warning about a handful of fields holds a handful of strings.
 */
export const LOG_ONCE_MAX_MESSAGES = 2000;

/** What has been logged is kept in two generations rather than one set: when `currentMessages` fills it becomes
 * `previousMessages` and a fresh one takes its place, so a message is still remembered for at least
 * `LOG_ONCE_MAX_MESSAGES` further distinct messages after it is first seen, and memory stays bounded at twice that.
 * Both halves matter. Reaching the cap must not un-remember everything at once, or a render producing more distinct
 * messages than the cap starts each pass with nothing remembered and logs all of them every time. And it must not stop
 * remembering either, since keys carrying a per-row id or index, or another tenant's form under SSR, fill the cap with
 * messages that never recur, and anything first seen afterwards would then log on every render for the rest of the
 * process's life.
 */
let currentMessages = new Set<string>();
let previousMessages = new Set<string>();

/** Remembers `key` and says whether it is new. A key found in `previousMessages` is deliberately left there rather than
 * promoted into `currentMessages`, so one seen on every render is logged a second time once two rotations have
 * displaced it. Promoting it would hold it forever, at the cost of a slot in the current generation too, which is what
 * caps how large a working set stays deduped: the largest one that survives, of exactly twice the cap, would drop to
 * one log per pass.
 *
 * @param key - What identifies the message
 * @returns - True the first time `key` is seen, false while it is still remembered
 */
export function rememberLogged(key: string): boolean {
  if (currentMessages.has(key) || previousMessages.has(key)) {
    return false;
  }
  if (currentMessages.size >= LOG_ONCE_MAX_MESSAGES) {
    previousMessages = currentMessages;
    currentMessages = new Set();
  }
  currentMessages.add(key);
  return true;
}

/** Forgets every remembered key */
export function forgetLogged() {
  currentMessages.clear();
  previousMessages.clear();
}
