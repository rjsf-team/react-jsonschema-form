import jsonpointer from 'jsonpointer';
import omit from 'lodash/omit';

import { REF_KEY } from './constants';
import { GenericObjectType, RJSFSchema, StrictRJSFSchema } from './types';

/** Splits out the value at the `key` in `object` from the `object`, returning an array that contains in the first
 * location, the `object` minus the `key: value` and in the second location the `value`.
 *
 * @param key - The key from the object to extract
 * @param object - The object from which to extract the element
 * @returns - An array with the first value being the object minus the `key` element and the second element being the
 *      value from `object[key]`
 */
export function splitKeyElementFromObject(key: string, object: GenericObjectType) {
  const value = object[key];
  const remaining = omit(object, [key]);
  return [remaining, value];
}

/** Given the name of a `$ref` from within a schema, using the `rootSchema`, look up and return the sub-schema using the
 * path provided by that reference. If `#` is not the first character of the reference, or the path does not exist in
 * the schema, then throw an Error. Otherwise return the sub-schema. Also deals with nested `$ref`s in the sub-schema.
 *
 * @param $ref - The ref string for which the schema definition is desired
 * @param [rootSchema={}] - The root schema in which to search for the definition
 * @returns - The sub-schema within the `rootSchema` which matches the `$ref` if it exists
 * @throws - Error indicating that no schema for that reference exists
 */
export default function findSchemaDefinition<S extends StrictRJSFSchema = RJSFSchema>(
  $ref?: string,
  rootSchema: S = {} as S
): S {
  let ref = $ref || '';
  if (ref.startsWith('#')) {
    // Decode URI fragment representation.
    ref = decodeURIComponent(ref.substring(1));
  } else {
    throw new Error(`Could not find a definition for ${$ref}.`);
  }
  const current: S = jsonpointer.get(rootSchema, ref);
  if (current === undefined) {
    throw new Error(`Could not find a definition for ${$ref}.`);
  }
  if (current[REF_KEY]) {
    const [remaining, theRef] = splitKeyElementFromObject(REF_KEY, current);
    const subSchema = findSchemaDefinition<S>(theRef, rootSchema);
    if (Object.keys(remaining).length > 0) {
      return { ...remaining, ...subSchema };
    }
    return subSchema;
  }
  return current;
}
