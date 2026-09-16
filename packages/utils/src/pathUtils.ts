import type { FieldPathList } from './types.ts';

/** A path into an object: either a list of path segments or a single property key (string or number).
 * A bare string is ALWAYS treated as one literal key — `'a.b'` is the key `'a.b'`, not a deep path. To
 * traverse a dotted path string, convert it explicitly with {@link toPath}
 */
export type ObjectPath = string | number | FieldPathList;

/** Matches unsigned integer strings that represent valid array indexes */
const reIsIndex = /^(?:0|[1-9]\d*)$/;

/** Converts a dotted path string, such as produced for validation error properties, into its list of
 * path segments. Array indexes may be written bracketed (`'a[0].b'`) or dotted (`'a.0.b'`), and empty
 * segments — from a leading `.`, a trailing `.` or a `..` run — are dropped.
 *
 * Only the grammar RJSF itself produces is supported: dots and brackets are always separators, so
 * quoted keys are not recognized and keys containing dots must be addressed with a segment list
 * instead of a string.
 *
 * @param path - The string path to convert, such as `'.level1.level2[2].level3'`
 * @returns - The list of path segments, such as `['level1', 'level2', '2', 'level3']`
 */
export function toPath(path: string): string[] {
  return path.split(/[.[\]]+/).filter(Boolean);
}

/** Normalizes an `ObjectPath` into a list of path segments, wrapping a single key into a one-element list */
function normalizePath(path: ObjectPath): FieldPathList {
  return Array.isArray(path) ? path : [path];
}

/** Determines whether a path segment could mutate the prototype chain. Only `__proto__` can: assigning to it
 * invokes the prototype setter rather than creating an own property. `constructor` and `prototype` are safe
 * here — and are legal JSON Schema property names — because both reads and writes below are own-property-only,
 * so `['constructor', 'prototype', 'polluted']` shadows `constructor` with a fresh object instead of walking
 * into `Object.prototype`. Only writes need this check; reads are already own-property-only
 */
function isUnsafeSegment(segment: string | number): boolean {
  return segment === '__proto__';
}

/** Determines whether a path segment represents a valid array index */
function isIndex(segment: string | number): boolean {
  return typeof segment === 'number' ? Number.isInteger(segment) && segment >= 0 : reIsIndex.test(segment);
}

/** Determines whether `value` can hold properties, i.e. is an object (arrays included) or a function */
function isSettable(value: unknown): value is Record<PropertyKey, unknown> {
  return value != null && (typeof value === 'object' || typeof value === 'function');
}

/** Gets the value at `path` of `obj`, returning `defaultValue` when the resolved value is `undefined`
 *
 * Every segment must be an OWN property, matching {@link hasByPath}, so the two can be used as a
 * guard/read pair. Inherited members are never resolved: `getByPath({}, 'toString')` returns
 * `defaultValue`, not `Function.prototype.toString`. For the plain form data and schemas RJSF navigates,
 * an inherited member is never data, and the own-property rule also makes prototype internals such as
 * `__proto__` unreachable unless they are genuine own data keys
 *
 * An empty segment list resolves to nothing, so `defaultValue` is returned. This matches {@link hasByPath},
 * which is `false` for an empty path, and keeps a computed-but-empty path (`toPath('')` for a root-level
 * validation error, say) from resolving to the whole object
 *
 * The value at a runtime-computed path cannot be known statically, so `R` is the CALLER'S declaration of
 * the expected type (like `Map.get()`); it defaults to `unknown`, which forces narrowing when no type is given
 *
 * @param obj - The object to query
 * @param path - The single key or list of path segments at which to get the value
 * @param [defaultValue] - The value returned when the resolved value is `undefined`
 * @returns - The resolved value, otherwise `defaultValue`
 */
export function getByPath<R = unknown>(obj: unknown, path: ObjectPath, defaultValue?: R): R {
  let current: unknown;
  if (!Array.isArray(path)) {
    // Fast path for the most common call shape, a single constant key, avoiding the segment-list allocation
    current = isSettable(obj) && Object.hasOwn(obj, path) ? obj[path] : undefined;
  } else if (path.length === 0) {
    // An empty path resolves to nothing, mirroring `hasByPath()`
    current = undefined;
  } else {
    current = obj;
    for (let i = 0; i < path.length; i++) {
      const segment = path[i];
      // Only own data keys resolve, so inherited members and prototype internals are never read
      if (!isSettable(current) || !Object.hasOwn(current, segment)) {
        current = undefined;
        break;
      }
      current = current[segment];
    }
  }
  // The single deliberate cast in these utilities: the resolved value is trusted to be the `R` the caller declared
  return (current === undefined ? defaultValue : current) as R;
}

/** Sets `value` at `path` of `obj`, mutating and returning `obj`. Missing intermediate containers are
 * created: arrays when the next segment is a valid array index, plain objects otherwise (or always plain
 * objects when `createIntermediateObjects` is true)
 *
 * A `__proto__` segment is refused in any position — assigning to it would mutate the prototype chain rather
 * than create an own property — and the write is silently skipped. Every other key, `constructor` and
 * `prototype` included, is written as an own property
 *
 * @param obj - The object to modify
 * @param path - The single key or list of path segments at which to set the value
 * @param value - The value to set
 * @param [createIntermediateObjects] - When true, always create plain objects for missing intermediate
 *        containers, even for numeric path segments
 * @returns - The mutated `obj`
 */
export function setByPath<O>(obj: O, path: ObjectPath, value: unknown, createIntermediateObjects = false): O {
  if (!isSettable(obj)) {
    return obj;
  }
  // Fast path for a single constant key, avoiding the segment-list allocation
  if (!Array.isArray(path)) {
    // Refuse a segment that could mutate the prototype chain (prototype pollution)
    if (!isUnsafeSegment(path)) {
      const target: Record<PropertyKey, unknown> = obj;
      target[path] = value;
    }
    return obj;
  }
  const segments = path;
  // Refuse paths that could mutate the prototype chain (prototype pollution)
  if (segments.some(isUnsafeSegment)) {
    return obj;
  }
  let current: Record<PropertyKey, unknown> = obj;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (i === segments.length - 1) {
      current[segment] = value;
    } else {
      // Own properties only, so an inherited member is never traversed into
      const existing = Object.hasOwn(current, segment) ? current[segment] : undefined;
      if (isSettable(existing)) {
        current = existing;
      } else {
        const next = createIntermediateObjects || !isIndex(segments[i + 1]) ? {} : [];
        current[segment] = next;
        /* v8 ignore next -- a fresh {} or [] is always settable; the guard exists only to narrow the type */
        if (isSettable(next)) {
          current = next;
        }
      }
    }
  }
  return obj;
}

/** Determines whether `obj` has an own property at `path`
 *
 * Every segment is checked with `Object.hasOwn()`, so inherited properties report `false` —
 * `hasByPath({}, 'toString')` is `false`. {@link getByPath} applies the same own-property rule, so the
 * two can be used as a guard/read pair
 *
 * @param obj - The object to query
 * @param path - The single key or list of path segments to check for
 * @returns - True if the own property exists at `path`, otherwise false
 */
export function hasByPath(obj: unknown, path: ObjectPath): boolean {
  // Fast path for a single constant key, avoiding the segment-list allocation
  if (!Array.isArray(path)) {
    return isSettable(obj) && Object.hasOwn(obj, path);
  }
  let current: unknown = obj;
  for (let i = 0; i < path.length; i++) {
    if (!isSettable(current) || !Object.hasOwn(current, path[i])) {
      return false;
    }
    current = current[path[i]];
  }
  return path.length > 0;
}

/** Removes the own property at `path` of `obj`, mutating `obj`
 *
 * Both the parent lookup and the delete are own-property-only, so no segment can reach the prototype chain and
 * no `UNSAFE_SEGMENTS`-style guard is needed: deleting a `__proto__` that is not an own property is a no-op
 *
 * @param obj - The object to modify
 * @param path - The single key or list of path segments at which to remove the property
 * @returns - True if the property was removed or did not exist, otherwise false
 */
export function unsetByPath(obj: unknown, path: ObjectPath): boolean {
  const segments = normalizePath(path);
  // An empty path names no property, so there is nothing to remove
  if (segments.length === 0) {
    return true;
  }
  const parent = segments.length > 1 ? getByPath(obj, segments.slice(0, -1)) : obj;
  if (parent == null) {
    return true;
  }
  try {
    // Returns false for a non-configurable property instead of throwing like `delete` in strict mode
    return Reflect.deleteProperty(parent, segments[segments.length - 1]);
  } catch {
    // Reflect.deleteProperty throws when the target is a primitive
    return false;
  }
}
