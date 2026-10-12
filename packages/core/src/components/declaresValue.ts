import type { RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { CONST_KEY, DEFAULT_KEY, isPlainObject } from '@rjsf/utils';

/** Determines whether `schema` declares a value of its own, which is what a schema that is not an object has instead
 * of a per-property declaration.
 *
 * @param schema - The schema to test
 * @returns - True when the schema declares a `default` or `const`
 */
export function declaresOwnValue<S extends StrictRJSFSchema = RJSFSchema>(schema: S): boolean {
  return DEFAULT_KEY in schema || CONST_KEY in schema;
}

/** Determines whether `level` declares a value for `key`, either on the property's own resolved schema or in the
 * level's own `default` object.
 *
 * The computed defaults are no guide on their own, which is the whole reason this exists: `getDefaultFormState()` also
 * returns a nested object's leaf defaults, `{}` for a required object, `[]` for a required array, `false` for a
 * required boolean and an `items` default repeated up to `minItems`. None of those is the level saying what the key
 * should hold, so treating them as such replaces a value the user is still holding with an empty container or with a
 * subset of what was there.
 *
 * @param level - The schema declaring `key`, whose own `default` may name it
 * @param key - The name of the property to test
 * @param keySchema - `key`'s resolved schema, already resolved by the caller
 * @returns - True when a `default` or `const` is declared for `key`
 */
export function declaresValueFor<S extends StrictRJSFSchema = RJSFSchema>(
  level: S,
  key: string,
  keySchema: S,
): boolean {
  if (declaresOwnValue<S>(keySchema)) {
    return true;
  }
  const levelDefault = level[DEFAULT_KEY];
  // `Object.hasOwn()`, so a property named `constructor` or `toString` is not answered for by the member every object
  // inherits under that name
  return isPlainObject(levelDefault) && Object.hasOwn(levelDefault, key);
}
