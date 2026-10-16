import { ERRORS_KEY } from './constants.ts';
import isPlainObject from './isPlainObject.ts';

/** The `value` under `key` when it is a child node of an `ErrorSchema`: a plain object, or an array holding the errors
 * of an array field's items. An `__errors` array holds messages, not nodes. It returns the node rather than being a type
 * predicate, since the answer also depends on `key`, and a predicate's false branch would narrow an `__errors` array
 * away.
 *
 * @param key - The key the value sits under
 * @param value - The value under `key`
 * @returns - `value` when the walks of an `ErrorSchema` descend into it, otherwise `undefined`
 */
export default function errorSchemaChild(key: string, value: unknown): Record<string, unknown> | unknown[] | undefined {
  return key !== ERRORS_KEY && (isPlainObject(value) || Array.isArray(value)) ? value : undefined;
}
