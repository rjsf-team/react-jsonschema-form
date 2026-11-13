import { isPlainObject } from '@rjsf/utils';
import type { Ajv } from 'ajv';

/** Whether `ajv` changes the data it validates: it fills defaults in under `useDefaults`, converts values in place
 * under `coerceTypes` and deletes properties under `removeAdditional`, and a keyword registered with `modifying: true`,
 * which Ajv requires of a keyword whose function changes the data, may change it too. A keyword that generates its own
 * code declares nothing of the kind, so one that writes into the data that way, such as ajv-keywords' `transform`,
 * isn't seen here.
 *
 * @param ajv - The Ajv instance, with the keywords registered with it so far
 * @returns - Whether validating with it can change the data
 */
export function changesData({ opts: { useDefaults, coerceTypes, removeAdditional }, RULES }: Ajv): boolean {
  return (
    Boolean(useDefaults || coerceTypes || removeAdditional) ||
    Object.values(RULES.all).some(
      (rule) => typeof rule === 'object' && 'modifying' in rule.definition && rule.definition.modifying === true,
    )
  );
}

/** Returns a copy of `data` for Ajv to change as it validates, since `isValid()` must not change the data it checks.
 * Arrays and plain objects are copied item by item and key by key, an object with no prototype keeping none, so Ajv,
 * which reads a property a schema names through the prototype, reads the same values from the copy. Any other object,
 * such as a `Date`, a `File` or a class instance, is copied with `structuredClone()`, which keeps what a `Date` or a
 * `File` holds and copies a class instance as a plain object of its own properties, and throws for one it can't copy,
 * such as a class instance holding a function.
 *
 * @param data - The data to copy
 * @returns - The copy
 */
export function copyForValidation(data: unknown): unknown {
  if (Array.isArray(data)) {
    const items: readonly unknown[] = data;
    return items.map(copyForValidation);
  }
  if (isPlainObject(data)) {
    // `fromEntries()` defines each key as the copy's own, a `__proto__` included
    const copy = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, copyForValidation(value)]));
    if (Object.getPrototypeOf(data) === null) {
      Object.setPrototypeOf(copy, null);
    }
    return copy;
  }
  return typeof data === 'object' && data !== null ? structuredClone(data) : data;
}
