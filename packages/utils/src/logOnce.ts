import toDisplayString from './toDisplayString.ts';

/** The console methods `logOnce()` can log through */
export type LogOnceLevel = 'warn' | 'error';

/** How `logOnce()` logs a message */
export interface LogOnceOptions {
  /** Which console method to log through, `'warn'` unless given */
  level?: LogOnceLevel;
  /** The error, or any other value, to pass to the console method after the message */
  error?: unknown;
  /** The ID of the problem the warning flags, which ends the message and which `setWarningOptions()` can make throw */
  id?: WarningId;
  /** Whether to skip a message already logged, `true` unless given. A caller that limits its own warning, such as to
   * once per form, passes `false`, so a later form logs it too
   */
  dedupe?: boolean;
}

/** The kinds of problem a warning with an ID flags: `migration` for v6 code that now does something else, each named in
 * the v7 upgrade-guide entry that explains it, and `config` for a uiSchema or option RJSF ignores whichever version it
 * was written for
 */
export type WarningCategory = 'migration' | 'config';

/** Each warning ID and its category. An ID names a kind of problem rather than one message, so it stays the same across
 * fields, renames and rewordings
 */
const WARNING_CATEGORIES = {
  'antd-span-twelfths': 'migration',
  'antd-span-own-width': 'migration',
  'create-schema-utils-validator-arg': 'migration',
  'ui-options-key-ignored': 'migration',
  'global-option-not-read': 'migration',
  'layout-grid-renders-nothing': 'migration',
  'option-field-ignored': 'migration',
  'form-data-not-passed-through': 'migration',
  'form-data-both-seeds': 'migration',
  'global-ui-options-key-not-read': 'config',
  'ui-widget-options-object': 'config',
  'ui-widget-element': 'config',
  'row-span-ignored': 'config',
  'layout-grid-cell-field-ignored': 'config',
  'ui-order-incomplete': 'config',
} as const satisfies Record<string, WarningCategory>;

/** The ID of a warning `setWarningOptions()` can make throw */
export type WarningId = keyof typeof WARNING_CATEGORIES;

/** The options `setWarningOptions()` takes */
export interface WarningOptions {
  /** The categories and IDs of the warnings that throw an `RJSFWarningError` rather than log */
  throwOn?: readonly (WarningCategory | WarningId)[];
  /** The IDs that log as usual, even where `throwOn` selects them */
  except?: readonly WarningId[];
}

/** @public What `logOnce()` throws for a warning whose ID `setWarningOptions()` selects, carrying that `id` and,
 * as its `cause`, the error the warning was logged with
 */
export class RJSFWarningError extends Error {
  readonly id: WarningId;

  constructor(message: string, id: WarningId, options?: ErrorOptions) {
    super(message, options);
    this.name = 'RJSFWarningError';
    this.id = id;
  }
}

/** The IDs `logOnce()` throws for, worked out when the options are set, so `logOnce()` checks one `Set` and the
 * category table stays out of a bundle that never imports `setWarningOptions()`
 */
let throwingIds = new Set<string>();

/** @public Sets which warnings with an ID throw an `RJSFWarningError` rather than log, for every form on the page.
 * Module-level, since several warnings are raised where no form's options reach, so it is set once from an app's
 * development entry point or a test setup. A warning without an ID never throws, and `resetLogOnce()` leaves this
 * setting as it is. A name it doesn't know, such as a misspelt ID from a setup file in plain JavaScript, is ignored
 * with a warning, and a `throwOn` or `except` that isn't an array throws a `TypeError`.
 *
 * @param [options={}] - The `throwOn` categories and IDs, and the IDs `except` keeps logging; `{}` restores the
 *        default of logging every warning
 */
export function setWarningOptions({ throwOn = [], except = [] }: WarningOptions = {}) {
  // A plain-JS caller's string would otherwise be read a character at a time, and match its names as substrings
  if (!Array.isArray(throwOn) || !Array.isArray(except)) {
    throw new TypeError('setWarningOptions() takes `throwOn` and `except` as arrays of warning categories or IDs');
  }
  // Widened, since `Object.entries()` reads the table's IDs as plain strings
  const selected: readonly string[] = throwOn;
  const excepted: readonly string[] = except;
  // A plain-JS setup file isn't type-checked, so a misspelt name would otherwise turn the setting off without a word
  const ids = Object.keys(WARNING_CATEGORIES);
  const idsAndCategories: readonly string[] = [...ids, ...Object.values(WARNING_CATEGORIES)];
  for (const name of selected) {
    if (!idsAndCategories.includes(name)) {
      // oxlint-disable-next-line no-console
      console.warn(`setWarningOptions() ignores "${name}" in \`throwOn\`, since it isn't a warning category or ID`);
    }
  }
  for (const name of excepted) {
    if (!ids.includes(name)) {
      // oxlint-disable-next-line no-console
      console.warn(`setWarningOptions() ignores "${name}" in \`except\`, since it isn't a warning ID`);
    }
  }
  throwingIds = new Set(
    Object.entries(WARNING_CATEGORIES)
      .filter(([id, category]) => (selected.includes(id) || selected.includes(category)) && !excepted.includes(id))
      .map(([id]) => id),
  );
}

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
 * @testSeam Exported for utils' own tests
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

/** Logs `message` (followed by `error`, when there is one) through `console.warn()` or `console.error()`, but only the
 * first time that combination of `level`, `message` and `error` is seen, so that a warning raised while rendering isn't
 * repeated on every re-render. The `error` is compared by its type and the text it is shown as, so two distinct
 * values of the same type and form (two `Error`s of the same class and message, say) are treated as one message. A
 * message that has to be told apart from another must say so itself, as the field warnings do by naming the field; one
 * that identifies nothing, or only something as generic as a `dependencies` key, is reported for whichever schema
 * reaches it first and stays silent for the rest until the page is reloaded.
 *
 * A warning given an `id` ends its message with it, and throws an `RJSFWarningError` instead of logging when
 * `setWarningOptions()` selects it. A throw isn't remembered, so it throws again on the next call.
 *
 * @param message - The message to log
 * @param [options={}] - The `level`, `error`, `id` and `dedupe` to log the message with
 */
export default function logOnce(message: string, { level = 'warn', error, id, dedupe = true }: LogOnceOptions = {}) {
  const text = id === undefined ? message : `${message} [${id}]`;
  if (id !== undefined && throwingIds.has(id)) {
    throw new RJSFWarningError(text, id, error === undefined ? undefined : { cause: error });
  }
  if (dedupe) {
    // The trailing separator keeps `logOnce(m)` and `logOnce(m, { error: '' })` two messages, and the type keeps an error
    // that `toDisplayString()` could only spell as its type apart from a string error of that text
    const key =
      error === undefined
        ? `${level}\u0000${text}`
        : `${level}\u0000${text}\u0000${typeof error}\u0000${toDisplayString(error)}`;
    // A message found in `previousMessages` is deliberately left there rather than promoted into `currentMessages`, so
    // one seen on every render is logged a second time once two rotations have displaced it. Promoting it would hold it
    // forever, at the cost of a slot in the current generation too, which is what caps how large a working set stays
    // deduped: the largest one that survives, of exactly twice the cap, would drop to one log per pass.
    if (currentMessages.has(key) || previousMessages.has(key)) {
      return;
    }
    if (currentMessages.size >= LOG_ONCE_MAX_MESSAGES) {
      previousMessages = currentMessages;
      currentMessages = new Set();
    }
    currentMessages.add(key);
  }
  const args = error === undefined ? [text] : [text, error];
  // `level` is only type-checked, so a JS caller can pass anything; `console[level]` would throw inside the very
  // render that was trying to warn, and the key is already remembered by then, so the message would never log at all.
  // The method is called on `console` rather than through a reference taken off it, since a polyfilled or proxied
  // console can need its receiver and would throw for the same reason
  if (level === 'error') {
    // oxlint-disable-next-line no-console
    console.error(...args);
  } else {
    // oxlint-disable-next-line no-console
    console.warn(...args);
  }
}

/** Forgets every message `logOnce()` has already logged, so each will be logged again the next time it is seen. Tests
 * need it so each one sees its own warnings, and an app that swaps schemas at runtime needs it for the same reason the
 * playground does: a wizard whose steps reuse the same field ids, a schema editor or a form builder would otherwise
 * have the second schema's warnings held back by the first's.
 */
export function resetLogOnce() {
  currentMessages.clear();
  previousMessages.clear();
}
