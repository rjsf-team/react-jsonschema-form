import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Determines whether a `thing` is an object for the purposes of RJSF. In this case, `thing` is an object if it has
 * the type `object` but is NOT null, an array or a File.
 *
 * @param thing - The thing to check to see whether it is an object
 * @returns - True if it is a non-null, non-array, non-File object
 */
export default function isObject(thing: unknown): thing is GenericObjectType {
  if (typeof thing !== 'object' || thing === null) {
    return false;
  }
  // lastModified is guaranteed to be a number on a File instance
  // as per https://w3c.github.io/FileAPI/#dfn-lastModified
  if (
    'lastModified' in thing &&
    typeof thing.lastModified === 'number' &&
    typeof File !== 'undefined' &&
    thing instanceof File
  ) {
    return false;
  }
  // getMonth is guaranteed to be a method on a Date instance
  // as per https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-date.prototype.getmonth
  if (
    'getMonth' in thing &&
    typeof thing.getMonth === 'function' &&
    typeof Date !== 'undefined' &&
    thing instanceof Date
  ) {
    return false;
  }
  return !Array.isArray(thing);
}

/** Narrows a schema definition -- which the JSON Schema types also allow to be a boolean, and which can be absent --
 * to the schema type the callers walk. A boolean or missing subschema describes no value of its own, so it has nothing
 * to walk into: `true` allows anything and `false` allows nothing.
 *
 * @param schemaDef - The schema definition to check
 * @returns - True when the definition is a schema object rather than a boolean shorthand or absent
 */
export function isSchemaObject<S extends StrictRJSFSchema = RJSFSchema>(schemaDef: unknown): schemaDef is S {
  return isObject(schemaDef);
}
