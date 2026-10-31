import type { ErrorSchema, FieldPathList } from '@rjsf/utils';
import { getByPath, isObject, setByPath, unsetByPath } from '@rjsf/utils';

/** Whether `prefix` addresses `path` itself or a container holding it, comparing the segments the way `toPath()` spells
 * them, so a numeric array index and its string form are the same segment
 *
 * @param prefix - The path that may lead into `path`
 * @param path - The path being addressed
 * @returns - True when every segment of `prefix` opens `path`
 */
export function isPathPrefix(prefix: FieldPathList, path: FieldPathList): boolean {
  return prefix.length <= path.length && prefix.every((segment, i) => String(segment) === String(path[i]));
}

/** `getByPath()` reading an empty path as the root itself. The overload is the one trust point that the value at a
 * path has the type its reader names: the type a field renders for the form's data, an `ErrorSchema` node for an
 * `ErrorSchema`.
 */
export function getAt<V>(data: unknown, segments: FieldPathList): V;
export function getAt(data: unknown, segments: FieldPathList): unknown {
  return segments.length === 0 ? data : getByPath(data, segments);
}

/** A copy of `errorSchema` with the node at `path` replaced by `node`. A `node` that holds nothing is gone, with the
 * ancestors that leaves empty, which a raise at one of them would read as errors still being there
 */
export function replaceErrorSchemaNode<T>(
  errorSchema: ErrorSchema<T>,
  path: FieldPathList,
  node: ErrorSchema<T>,
): ErrorSchema<T> {
  if (path.length === 0) {
    return node;
  }
  // An `ErrorSchema` nests plain objects even at numeric segments, so never auto-vivify arrays
  const replaced = setByPath(copyAlongPath(errorSchema, path), path, node, true);
  // Every container along `path` is a copy or newly made, so unsetting in place touches nothing the state holds
  for (let depth = path.length; depth > 0; depth--) {
    const ancestor = path.slice(0, depth);
    if (Object.keys(getByPath<object>(replaced, ancestor, {})).length > 0) {
      break;
    }
    unsetByPath(replaced, ancestor);
  }
  return replaced;
}

/** Returns `data` with every container along `path` shallow-copied, leaving the copies ready for a write at that
 * path that must not touch the original. Subtrees off the path keep the reference the fields already hold, so
 * nothing has to walk the data afterwards to restore the sharing a deep clone would have destroyed. Stops where
 * the path runs off the end of what is actually there, since `setByPath()` creates the rest itself; the copies made
 * up to that point are what keeps it from creating them inside a container the committed state still holds.
 *
 * @param data - The data to copy along `path`
 * @param path - The path whose containers are copied
 * @returns - The copied data, or `data` itself when it holds no containers to copy
 */
export function copyAlongPath<T>(data: T, path: FieldPathList): T {
  if (!isObject(data) && !Array.isArray(data)) {
    return data;
  }
  const copyOf = (container: object) => (Array.isArray(container) ? [...container] : { ...container });
  const root = copyOf(data as object) as Record<PropertyKey, unknown>;
  let container = root;
  for (const segment of path.slice(0, -1)) {
    // Own keys only, as `setByPath()` reads them: a `__proto__` the data does not hold as its own key reads the
    // prototype, and writing a copy of that back would re-point the root copy's prototype instead of adding a key
    const child = Object.hasOwn(container, segment) ? container[segment] : undefined;
    if (!isObject(child) && !Array.isArray(child)) {
      break;
    }
    const copy = copyOf(child as object) as Record<PropertyKey, unknown>;
    container[segment] = copy;
    container = copy;
  }
  return root as T;
}
