import type { FieldPathList } from './types';

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

/** Segments that could reach into an object's prototype chain and enable prototype pollution */
const UNSAFE_SEGMENTS = new Set(['__proto__', 'constructor', 'prototype']);

/** Determines whether a path segment could traverse or mutate the prototype chain */
function isUnsafeSegment(segment: string | number): boolean {
  return typeof segment === 'string' && UNSAFE_SEGMENTS.has(segment);
}

/** Determines whether a path segment represents a valid array index */
function isIndex(segment: string | number): boolean {
  return typeof segment === 'number' ? Number.isInteger(segment) && segment >= 0 : reIsIndex.test(segment);
}

/** Determines whether `value` can hold properties, i.e. is an object or a function */
function isSettable(value: unknown): boolean {
  return value != null && (typeof value === 'object' || typeof value === 'function');
}

/** Gets the value at `path` of `obj`, returning `defaultValue` when the resolved value is `undefined`
 *
 * Like `lodash.get`, reads traverse the prototype chain, so `getByPath({}, 'toString')` resolves
 * `Function.prototype.toString` rather than `undefined`. {@link hasByPath} is own-property-only, so the
 * two are NOT a matching guard/read pair for inherited keys: `hasByPath()` can report `false` for a key
 * that `getByPath()` still resolves to a non-`undefined` value. Only `__proto__`, `constructor` and
 * `prototype` are excluded unless they are genuine own data keys. This is harmless for the plain
 * form-data and schema objects RJSF passes here, but check for own keys explicitly when it matters
 *
 * @param obj - The object to query
 * @param path - The single key or list of path segments at which to get the value
 * @param [defaultValue] - The value returned when the resolved value is `undefined`
 * @returns - The resolved value, otherwise `defaultValue`
 */
export function getByPath<R = any>(obj: unknown, path: ObjectPath, defaultValue?: R): R {
  const segments = normalizePath(path);
  let current: any = obj;
  for (const segment of segments) {
    // Prototype-chain segments only resolve when they are real own data keys, never leaking internals
    if (current == null || (isUnsafeSegment(segment) && !Object.hasOwn(current, segment))) {
      return defaultValue as R;
    }
    current = current[segment];
  }
  return current === undefined ? (defaultValue as R) : current;
}

/** Sets `value` at `path` of `obj`, mutating and returning `obj`. Missing intermediate containers are
 * created: arrays when the next segment is a valid array index, plain objects otherwise (or always plain
 * objects when `createIntermediateObjects` is true)
 *
 * @param obj - The object to modify
 * @param path - The single key or list of path segments at which to set the value
 * @param value - The value to set
 * @param [createIntermediateObjects] - When true, always create plain objects for missing intermediate
 *        containers, even for numeric path segments
 * @returns - The mutated `obj`
 */
export function setByPath<O = any>(obj: O, path: ObjectPath, value: unknown, createIntermediateObjects = false): O {
  if (!isSettable(obj)) {
    return obj;
  }
  const segments = normalizePath(path);
  // Refuse paths that could mutate the prototype chain (prototype pollution)
  if (segments.some(isUnsafeSegment)) {
    return obj;
  }
  let current: any = obj;
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    if (i === segments.length - 1) {
      current[segment] = value;
    } else {
      const existing = current[segment];
      if (!isSettable(existing)) {
        current[segment] = createIntermediateObjects || !isIndex(segments[i + 1]) ? {} : [];
      }
      current = current[segment];
    }
  }
  return obj;
}

/** Determines whether `obj` has an own property at `path`
 *
 * Like `lodash.has`, every segment is checked with `Object.hasOwn()`, so inherited properties report
 * `false` — `hasByPath({}, 'toString')` is `false`. {@link getByPath} does traverse the prototype
 * chain, so the two are NOT a matching guard/read pair for inherited keys
 *
 * @param obj - The object to query
 * @param path - The single key or list of path segments to check for
 * @returns - True if the own property exists at `path`, otherwise false
 */
export function hasByPath(obj: unknown, path: ObjectPath): boolean {
  const segments = normalizePath(path);
  let current: any = obj;
  for (const segment of segments) {
    if (current == null || !Object.hasOwn(current, segment)) {
      return false;
    }
    current = current[segment];
  }
  return segments.length > 0;
}

/** Removes the own property at `path` of `obj`, mutating `obj`
 *
 * @param obj - The object to modify
 * @param path - The single key or list of path segments at which to remove the property
 * @returns - True if the property was removed or did not exist, otherwise false
 */
export function unsetByPath(obj: unknown, path: ObjectPath): boolean {
  const segments = normalizePath(path);
  const parent = segments.length > 1 ? getByPath(obj, segments.slice(0, -1)) : obj;
  if (parent == null) {
    return true;
  }
  try {
    return delete parent[segments[segments.length - 1]];
  } catch {
    // Deleting a non-configurable property, or a property of a primitive, throws in strict mode
    return false;
  }
}
