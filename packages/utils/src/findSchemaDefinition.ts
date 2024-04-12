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

/** Given the name of a `$ref` from within a schema, using the `rootSchema`, recursively look up and return the
 * sub-schema using the path provided by that reference. If `#` is not the first character of the reference, the path
 * does not exist in the schema, or the reference resolves circularly back to itself, then throw an Error.
 * Otherwise return the sub-schema. Also deals with nested `$ref`s in the sub-schema.
 *
 * @param $ref - The ref string for which the schema definition is desired
 * @param [rootSchema={}] - The root schema in which to search for the definition
 * @param recurseList - List of $refs already resolved to prevent recursion
 * @returns - The sub-schema within the `rootSchema` which matches the `$ref` if it exists
 * @throws - Error indicating that no schema for that reference could be resolved
 */
export function findSchemaDefinitionRecursive<S extends StrictRJSFSchema = RJSFSchema>(
  $ref?: string,
  rootSchema: S = {} as S,
  recurseList: string[] = []
): S {
  const ref = $ref || '';
  let decodedRef;
  if (ref.startsWith('#')) {
    // Decode URI fragment representation.
    decodedRef = decodeURIComponent(ref.substring(1));
  } else {
    throw new Error(`Could not find a definition for ${$ref}.`);
  }
  const current: S = jsonpointer.get(rootSchema, decodedRef);
  if (current === undefined) {
    throw new Error(`Could not find a definition for ${$ref}.`);
  }
  const nextRef = current[REF_KEY];
  if (nextRef) {
    // Check for circular references.
    if (recurseList.includes(nextRef)) {
      if (recurseList.length === 1) {
        throw new Error(`Definition for ${$ref} is a circular reference`);
      }
      const [firstRef, ...restRefs] = recurseList;
      const circularPath = [...restRefs, ref, firstRef].join(' -> ');
      throw new Error(`Definition for ${firstRef} contains a circular reference through ${circularPath}`);
    }
    const [remaining, theRef] = splitKeyElementFromObject(REF_KEY, current);
    const subSchema = findSchemaDefinitionRecursive<S>(theRef, rootSchema, [...recurseList, ref]);
    if (Object.keys(remaining).length > 0) {
      return { ...remaining, ...subSchema };
    }
    return subSchema;
  }
  return current;
}

/** Given the name of a `$ref` from within a schema, using the `rootSchema`, look up and return the sub-schema using the
 * path provided by that reference. If `#` is not the first character of the reference, the path does not exist in
 * the schema, or the reference resolves circularly back to itself, then throw an Error. Otherwise return the
 * sub-schema. Also deals with nested `$ref`s in the sub-schema.
 *
 * @param $ref - The ref string for which the schema definition is desired
 * @param [rootSchema={}] - The root schema in which to search for the definition
 * @returns - The sub-schema within the `rootSchema` which matches the `$ref` if it exists
 * @throws - Error indicating that no schema for that reference could be resolved
 */
export default function findSchemaDefinition<S extends StrictRJSFSchema = RJSFSchema>(
  $ref?: string,
  rootSchema: S = {} as S
): S {
  const recurseList: string[] = [];
  return findSchemaDefinitionRecursive($ref, rootSchema, recurseList);
}
