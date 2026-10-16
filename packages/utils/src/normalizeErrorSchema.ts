import errorSchemaChild from './errorSchemaChild.ts';
import type { ErrorSchema } from './types.ts';

/** The node with every array below it, and itself if it is one, rewritten as a plain object keyed by index, or the
 * node itself when there is none. A `null` or `undefined` child holds no errors and is left out, as a hole is, since
 * `mergeObjects()` would otherwise let it replace the other `ErrorSchema`'s node under that key, as an `undefined` an
 * array of item errors holds for an item without any would. Nothing is copied until a change is found, since the trees
 * the validators build never hold an array and are walked on every merge. `Object.fromEntries()` defines each key as an
 * own property, so a `__proto__` key is copied rather than swapping the copy's prototype.
 *
 * @param node - The error schema node
 * @returns - The node in the shape `toErrorSchema()` builds
 */
function normalizeNode(node: Record<string, unknown> | unknown[]): Record<string, unknown> {
  if (Array.isArray(node)) {
    return Object.fromEntries(
      Object.entries(node)
        .filter(([, value]) => value != null)
        .map(([key, value]) => [key, normalizeChild(key, value)]),
    );
  }
  const keys = Object.keys(node);
  let entries: [string, unknown][] | undefined;
  keys.forEach((key, index) => {
    const value = node[key];
    const isEmpty = value == null;
    const child = normalizeChild(key, value);
    if (!entries && (isEmpty || child !== value)) {
      entries = keys.slice(0, index).map((before): [string, unknown] => [before, node[before]]);
    }
    if (!isEmpty) {
      entries?.push([key, child]);
    }
  });
  return entries ? Object.fromEntries(entries) : node;
}

/** The `value` under `key` of an `ErrorSchema` node, normalized when it is a child node
 *
 * @param key - The key the value sits under
 * @param value - The value under `key`
 * @returns - The value in the shape `toErrorSchema()` builds
 */
function normalizeChild(key: string, value: unknown): unknown {
  const node = errorSchemaChild(key, value);
  return node ? normalizeNode(node) : value;
}

/** Rewrites the arrays an `ErrorSchema` holds for the items of an array field as plain objects keyed by index, the
 * shape `toErrorSchema()` builds and the one the error list, the merge and the field lookups walk. The type accepts an
 * array there, and an `extraErrors`, a field's raised errors or a `customValidate` may hold one. The `__errors` arrays
 * of messages are left as they are.
 *
 * @param errorSchema - The `ErrorSchema` to normalize
 * @returns - The `errorSchema` itself when it holds no such array, otherwise a copy without them
 */
export default function normalizeErrorSchema<T = unknown>(errorSchema: ErrorSchema<T>): ErrorSchema<T> {
  // The rewrite only replaces arrays with the objects that index them, so the result still describes `T`
  return normalizeNode(errorSchema) as ErrorSchema<T>;
}
