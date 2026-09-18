import isPlainObject from './isPlainObject.ts';

/** Structural sharing, as TanStack Query's `replaceEqualDeep` does for fetch results: returns `next` with every
 * subtree deeply equal to its counterpart in `prev` replaced by the `prev` instance, and `prev` itself when the whole
 * value is unchanged, so consumers comparing by reference see unchanged data as unchanged. Plain objects, arrays and
 * equal-valued `Date`s are shared; any other object is opaque and `next` is kept. Neither argument is mutated.
 *
 * @param prev - The previous value whose references should be retained where possible
 * @param next - The newly computed value
 * @returns - `prev` when the values are deeply equal, otherwise `next` (or a copy of it) sharing every unchanged
 *   subtree with `prev`
 */
export default function replaceEqualDeep<T>(prev: unknown, next: T): T;
export default function replaceEqualDeep(prev: unknown, next: unknown): unknown {
  if (Object.is(prev, next)) {
    return next;
  }
  if (Array.isArray(prev) && Array.isArray(next)) {
    let sameAsPrev = prev.length === next.length;
    let copy: unknown[] | undefined;
    for (let i = 0; i < next.length; i++) {
      const value: unknown = replaceEqualDeep(prev[i], next[i]);
      sameAsPrev &&= Object.is(value, prev[i]);
      if (!Object.is(value, next[i])) {
        copy ??= next.slice();
        copy[i] = value;
      }
    }
    return sameAsPrev ? prev : (copy ?? next);
  }
  if (isPlainObject(prev) && isPlainObject(next)) {
    const nextKeys = Object.keys(next);
    let sameAsPrev = nextKeys.length === Object.keys(prev).length;
    let copy: Record<string, unknown> | undefined;
    for (const key of nextKeys) {
      const value = replaceEqualDeep(prev[key], next[key]);
      sameAsPrev &&= Object.hasOwn(prev, key) && Object.is(value, prev[key]);
      if (!Object.is(value, next[key])) {
        // Spread keeps a JSON-sourced own `__proto__` key an own key, so the assignment below never reaches the setter
        copy ??= { ...next };
        copy[key] = value;
      }
    }
    if (sameAsPrev) {
      return prev;
    }
    if (!copy) {
      return next;
    }
    const proto = Object.getPrototypeOf(next);
    // Reassigning a prototype deoptimizes property access, so only a null-prototype source pays for it
    return proto === Object.prototype ? copy : Object.setPrototypeOf(copy, proto);
  }
  if (prev instanceof Date && next instanceof Date && prev.getTime() === next.getTime()) {
    return prev;
  }
  return next;
}
