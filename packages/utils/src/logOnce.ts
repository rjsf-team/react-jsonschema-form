import { forgetLogged, rememberLogged } from './loggedMessages.ts';
import toDisplayString from './toDisplayString.ts';

export { LOG_ONCE_MAX_MESSAGES } from './loggedMessages.ts';

/** The console methods `logOnce()` can log through */
export type LogOnceLevel = 'warn' | 'error';

/** Logs `message` (followed by `error`, when there is one) through `console.warn()` or `console.error()`, but only the
 * first time that combination of `level`, `message` and `error` is seen, so that a warning raised while rendering isn't
 * repeated on every re-render. The `error` is compared by its type and its `toDisplayString()` form, so two distinct
 * values of the same type and form (two `Error`s of the same class and message, say) are treated as one message. A
 * message that has to be told apart from another must say so itself, as the field warnings do by naming the field; one
 * that identifies nothing, or only something as generic as a `dependencies` key, is reported for whichever schema
 * reaches it first and stays silent for the rest until the page is reloaded.
 *
 * @param message - The message to log
 * @param [level='warn'] - Which console method to log through
 * @param [error] - The error, or any other value, to pass to the console method after the `message`
 */
export default function logOnce(message: string, level: LogOnceLevel = 'warn', error?: unknown) {
  // The trailing separator keeps `logOnce(m)` and `logOnce(m, 'warn', '')` two messages, and the type keeps an error
  // that `toDisplayString()` could only spell as its type apart from a string error of that text
  const key =
    error === undefined
      ? `${level}\u0000${message}`
      : `${level}\u0000${message}\u0000${typeof error}\u0000${toDisplayString(error)}`;
  if (!rememberLogged(key)) {
    return;
  }
  const args = error === undefined ? [message] : [message, error];
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
export const resetLogOnce = forgetLogged;
