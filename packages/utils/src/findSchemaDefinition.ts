import jsonpointer from 'jsonpointer';
import omit from 'lodash/omit';

import { REF_NAME } from './constants';
import { RJSFSchema } from './types';

/** Given the name of a `$ref` from within a schema, using the `rootSchema`, look up and return the sub-schema using the
 * path provided by that reference. If `#` is not the first character of the reference, or the path does not exist in
 * the schema, then throw an Error. Otherwise return the sub-schema. Also deals with nested `$ref`s in the sub-schema.
 *
 * @param $ref - The ref string for which the schema definition is desired
 * @param rootSchema - The root schema in which to search for the definition
 * @throws - Error indicating that no schema for that reference exists
 */
export default function findSchemaDefinition($ref: string, rootSchema: RJSFSchema = {}): RJSFSchema {
  let ref = $ref;
  if (ref.startsWith('#')) {
    // Decode URI fragment representation.
    ref = decodeURIComponent(ref.substring(1));
  } else {
    throw new Error(`Could not find a definition for ${$ref}.`);
  }
  const current: RJSFSchema = jsonpointer.get(rootSchema, ref);
  if (current === undefined) {
    throw new Error(`Could not find a definition for ${$ref}.`);
  }
  if (current[REF_NAME]) {
    const subSchema = findSchemaDefinition(current[REF_NAME]!, rootSchema);
    if (Object.keys(current).length > 1) {
      return { ...omit(current, [REF_NAME]), ...subSchema };
    }
    return subSchema;
  }
  return current;
}
