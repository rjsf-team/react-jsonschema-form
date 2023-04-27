import { RJSFSchema, StrictRJSFSchema } from './types';

/** JS has no built-in hashing function, so rolling our own
 *  based on Java's hashing fn:
 *  http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 *
 * @param string - The string for which to get the hash
 * @returns - The resulting hash of the string
 */
function hashString(string: string): string {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    const chr = string.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return String(hash);
}

/** Stringifies the schema and returns the hash of the resulting string.
 *
 * @param schema - The schema for which the hash is desired
 * @returns - The string obtained from the hash of the stringified schema
 */
export default function hashForSchema<S extends StrictRJSFSchema = RJSFSchema>(schema: S) {
  return hashString(JSON.stringify(schema));
}
