import isObject from './isObject';
import type { RJSFSchema, StrictRJSFSchema } from './types';

/** Detects whether the given `schema` contains fixed items. This is the case when `schema.items` is an array that only
 * contains objects.
 *
 * @param schema - The schema in which to check for fixed items
 * @returns - True if there are fixed items in the schema, false otherwise
 */
export default function isFixedItems<S extends StrictRJSFSchema = RJSFSchema>(schema: S) {
  return Array.isArray(schema.items) && schema.items.every((item) => isObject(item));
}
