/** Determines whether `value` is a plain object — one whose prototype is `Object.prototype` or `null` — as opposed
 * to an array, class instance, Date or other exotic object
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/** Returns `next` with the object references of `prev` grafted back in wherever a subtree is unchanged, so that
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
export default function retainObjectIdentity<T>(prev: unknown, next: T): T {
  if (Object.is(prev, next)) {
    return next;
  }
  if (Array.isArray(prev) && Array.isArray(next)) {
    const retained = next.map((value, i) => retainObjectIdentity(prev[i], value));
    if (prev.length === next.length && retained.every((value, i) => Object.is(value, prev[i]))) {
      return prev as unknown as T;
    }
    if (retained.every((value, i) => Object.is(value, next[i]))) {
      return next;
    }
    return retained as unknown as T;
  }
  if (isPlainObject(prev) && isPlainObject(next)) {
    const nextKeys = Object.keys(next);
    const retained: Record<string, unknown> = {};
    let sameAsPrev = nextKeys.length === Object.keys(prev).length;
    let sameAsNext = true;
    for (const key of nextKeys) {
      const value = retainObjectIdentity(prev[key], next[key]);
      retained[key] = value;
      if (!Object.is(value, prev[key]) || !(key in prev)) {
        sameAsPrev = false;
      }
      if (!Object.is(value, next[key])) {
        sameAsNext = false;
      }
    }
    if (sameAsPrev) {
      return prev as T;
    }
    if (sameAsNext) {
      return next;
    }
    return retained as T;
  }
  if (prev instanceof Date && next instanceof Date && prev.getTime() === next.getTime()) {
    return prev as T;
  }
  return next;
}
