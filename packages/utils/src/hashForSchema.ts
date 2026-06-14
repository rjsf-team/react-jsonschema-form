import type { RJSFSchema, StrictRJSFSchema } from './types';

import hashString from './hashString';
import sortedJSONStringify from './sortedJSONStringify';

export { hashString, sortedJSONStringify };

/** Stringifies an `object` and returns the hash of the resulting string. Sorts object fields
 * in consistent order before stringify to prevent different hash ids for the same object.
 *
 * @param object - The object for which the hash is desired
 * @returns - The string obtained from the hash of the stringified object
 */
export function hashObject(object: unknown): string {
  return hashString(sortedJSONStringify(object));
}

/** Stringifies the schema and returns the hash of the resulting string. Sorts schema fields
 * in consistent order before stringify to prevent different hash ids for the same schema.
 * Symbol-keyed properties (RJSF_REF_KEY, RJSF_REF_CYCLE_KEY, ADDITIONAL_PROPERTY_FLAG) are
 * automatically excluded by JSON.stringify, so no special filtering is needed.
 *
 * @param schema - The schema for which the hash is desired
 * @returns - The string obtained from the hash of the stringified schema
 */
export default function hashForSchema<S extends StrictRJSFSchema = RJSFSchema>(schema: S) {
  return hashString(sortedJSONStringify(schema));
}
