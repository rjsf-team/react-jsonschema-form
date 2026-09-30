import isPlainObject from './isPlainObject.ts';

/** Whether JSON has a form for `value` itself, leaving its contents to be checked on their own */
function hasJsonForm(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    Array.isArray(value) ||
    isPlainObject(value)
  );
}

/** `JSON.stringify()` replacer that spells any value JSON has no form for, nested at any depth, the way `String()`
 * does, so that two nested errors, regexps or `BigInt`s aren't all written as `{}`, dropped or thrown on
 */
function stringifyNonJson(_key: string, value: unknown): unknown {
  return hasJsonForm(value) ? value : String(value);
}

/** Converts `value` to a string the way `String()` does, except that a plain object or an array is spelled out as
 * JSON, since `String()` would turn every plain object into the same `[object Object]`. Values inside it that JSON has
 * no form for are spelled the way `String()` spells them, so they read the same as a string of that text: `{ a: 10n }`
 * and `{ a: '10' }` both give `{"a":"10"}`. A plain object or array that still can't be converted, such
 * as a circular one or one whose `toJSON()` returns `undefined`, falls back to `String()`.
 *
 * @param value - The value to convert
 * @returns - The string form of `value`
 * @throws - Whatever `String()` throws for `value`, such as the `TypeError` for an object with no prototype that has
 *        to fall back to it
 */
export default function toDisplayString(value: unknown): string {
  if (Array.isArray(value) || isPlainObject(value)) {
    try {
      const json: string | undefined = JSON.stringify(value, stringifyNonJson);
      if (json !== undefined) {
        return json;
      }
    } catch {
      // A circular value; `String()` below still gives it a form, as `join()` tolerates cycles
    }
  }
  return String(value);
}
