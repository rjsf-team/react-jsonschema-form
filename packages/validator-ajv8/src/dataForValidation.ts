import { isPlainObject } from '@rjsf/utils';
import type { Options } from 'ajv';

/** Whether Ajv built with `options` changes the data it validates: it fills defaults in under `useDefaults`, converts
 * values in place under `coerceTypes` and deletes properties under `removeAdditional`
 *
 * @param options - The options of the Ajv instance
 * @returns - Whether validating with them can change the data
 */
export function changesData({ useDefaults, coerceTypes, removeAdditional }: Options): boolean {
  return Boolean(useDefaults || coerceTypes || removeAdditional);
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
