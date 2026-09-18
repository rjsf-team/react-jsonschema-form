import isPlainObject from './isPlainObject.ts';

/** Returns `next` with every subtree that is deeply equal to the corresponding subtree of `prev` replaced by the
 * `prev` instance (structural sharing, as TanStack Query's `replaceEqualDeep` does for fetch results), so that
 * consumers comparing by reference (such as `React.memo` with shallow comparison) see unchanged data as unchanged.
 * When the whole value is unchanged, `prev` itself is returned. Sharing happens for plain objects and arrays;
 * equal-valued `Date`s retain the previous instance; any other object type is treated as opaque and `next` is kept.
 *
 * Neither argument is mutated: when a container is only partially unchanged, a new container holding the retained
 * children is returned.
 *
 * @param prev - The previous value whose references should be retained where possible
 * @param next - The newly computed value
 * @returns - `prev` when the values are deeply equal, otherwise `next` (or a copy of it) sharing every unchanged
 *   subtree with `prev`
 */
export default function replaceEqualDeep<T>(prev: unknown, next: T): T {
  if (Object.is(prev, next)) {
    return next;
  }
  if (Array.isArray(prev) && Array.isArray(next)) {
    let sameAsPrev = prev.length === next.length;
    let copy: unknown[] | undefined;
    for (let i = 0; i < next.length; i++) {
      const value = replaceEqualDeep(prev[i], next[i]);
      sameAsPrev &&= Object.is(value, prev[i]);
      if (!Object.is(value, next[i])) {
        copy ??= next.slice();
        copy[i] = value;
      }
    }
    return (sameAsPrev ? prev : (copy ?? next)) as T;
  }
  if (isPlainObject(prev) && isPlainObject(next)) {
    const nextKeys = Object.keys(next);
    let sameAsPrev = nextKeys.length === Object.keys(prev).length;
    let copy: Record<string, unknown> | undefined;
    for (const key of nextKeys) {
      const value = replaceEqualDeep(prev[key], next[key]);
      sameAsPrev &&= Object.hasOwn(prev, key) && Object.is(value, prev[key]);
      if (!Object.is(value, next[key])) {
        // Spread defines own data properties, so a JSON-sourced own `__proto__` key stays a key on the copy, and the
        // assignment then writes to that own key instead of reaching the prototype setter
        copy ??= { ...next };
        copy[key] = value;
      }
    }
    if (sameAsPrev) {
      return prev as T;
    }
    if (!copy) {
      return next;
    }
    const proto = Object.getPrototypeOf(next);
    // reassigning a prototype deoptimizes property access, so only a null-prototype source pays for it
    return (proto === Object.prototype ? copy : Object.setPrototypeOf(copy, proto)) as T;
  }
  if (prev instanceof Date && next instanceof Date && prev.getTime() === next.getTime()) {
    return prev as T;
  }
  return next;
}
