import isPlainObject from './isPlainObject.ts';

function isReactElement(thing: unknown): thing is { $$typeof: unknown; type: unknown; key: unknown; props: unknown } {
  // `$$typeof` alone is not enough: `forwardRef()`, `memo()`, `lazy()`, contexts and portals carry one too and have
  // no `type`/`props` pair, so comparing those three would report every one of them as equal to every other
  return isPlainObject(thing) && '$$typeof' in thing && 'type' in thing && 'props' in thing;
}

/** Whether `prev` and `next` carry the same own enumerable symbol keys with identical values. RJSF marks schemas with
 * symbols (`ADDITIONAL_PROPERTY_FLAG`, `RJSF_REF_KEY`, `RJSF_REF_CYCLE_KEY`), which `Object.keys()` cannot see, so
 * without this two schemas differing only in a marker would be treated as the same one.
 */
function sameOwnSymbols(prev: object, next: object): boolean {
  const prevSymbols = Object.getOwnPropertySymbols(prev);
  return (
    prevSymbols.length === Object.getOwnPropertySymbols(next).length &&
    prevSymbols.every(
      (symbol) => Object.hasOwn(next, symbol) && Object.is(Reflect.get(prev, symbol), Reflect.get(next, symbol)),
    )
  );
}

/** The container pairs the walk is currently inside, as a flat `prev, next, prev, next, ...` stack. A `formContext`
 * may hold a graph that refers back to itself, and `deepEquals()` survives one, so this walk has to as well. A cycle can
 * only recur through an ancestor on the current path, so the path is all that needs checking, and one array per call
 * keeps the cycle safety from costing an allocation per container in the plain data that never has one. Pairs are
 * popped on the way out, so a value reachable by more than one path is still shared as long as it does not contain
 * itself.
 */
type WalkedPairs = object[];

function isWalking(walked: WalkedPairs, prev: object, next: object): boolean {
  for (let i = 0; i < walked.length; i += 2) {
    if (walked[i] === prev && walked[i + 1] === next) {
      return true;
    }
  }
  return false;
}

function leavePair<R>(walked: WalkedPairs, result: R): R {
  walked.pop();
  walked.pop();
  return result;
}

function shareUnchanged(prev: unknown, next: unknown, walked: WalkedPairs): unknown {
  if (Object.is(prev, next)) {
    return next;
  }
  if (Array.isArray(prev) && Array.isArray(next)) {
    if (isWalking(walked, prev, next)) {
      return next;
    }
    walked.push(prev, next);
    let sameAsPrev = prev.length === next.length;
    let copy: unknown[] | undefined;
    for (let i = 0; i < next.length; i++) {
      const value: unknown = shareUnchanged(prev[i], next[i], walked);
      sameAsPrev &&= Object.is(value, prev[i]);
      if (!Object.is(value, next[i])) {
        copy ??= next.slice();
        copy[i] = value;
      }
    }
    return leavePair(walked, sameAsPrev ? prev : (copy ?? next));
  }
  if (isReactElement(prev) && isReactElement(next)) {
    // A React element's identity is its type, key and props; `_owner` and the dev-only `_debug*` fields differ on
    // every render, as `deepEquals()` also disregards them
    return prev.$$typeof === next.$$typeof &&
      prev.type === next.type &&
      prev.key === next.key &&
      Object.is(shareUnchanged(prev.props, next.props, walked), prev.props)
      ? prev
      : next;
  }
  if (isPlainObject(prev) && isPlainObject(next)) {
    if (isWalking(walked, prev, next)) {
      return next;
    }
    walked.push(prev, next);
    const nextKeys = Object.keys(next);
    let sameAsPrev = true;
    let copy: Record<string, unknown> | undefined;
    for (const key of nextKeys) {
      const value = shareUnchanged(prev[key], next[key], walked);
      sameAsPrev &&= Object.hasOwn(prev, key) && Object.is(value, prev[key]);
      if (!Object.is(value, next[key])) {
        // Spread keeps a JSON-sourced own `__proto__` key an own key, so the assignment below never reaches the setter
        copy ??= { ...next };
        copy[key] = value;
      }
    }
    if (sameAsPrev && nextKeys.length === Object.keys(prev).length && sameOwnSymbols(prev, next)) {
      return leavePair(walked, prev);
    }
    if (!copy) {
      return leavePair(walked, next);
    }
    const proto = Object.getPrototypeOf(next);
    // Reassigning a prototype deoptimizes property access, so only a null-prototype source pays for it
    return leavePair(walked, proto === Object.prototype ? copy : Object.setPrototypeOf(copy, proto));
  }
  if (prev instanceof Date && next instanceof Date && prev.getTime() === next.getTime()) {
    return prev;
  }
  return next;
}

/** Structural sharing, as TanStack Query's `replaceEqualDeep` does for fetch results: returns `next` with every
 * subtree deeply equal to its counterpart in `prev` replaced by the `prev` instance, and `prev` itself when the whole
 * value is unchanged, so consumers comparing by reference see unchanged data as unchanged. Plain objects, arrays,
 * equal-valued `Date`s and React elements of the same type, key and props are shared; any other object is opaque and
 * `next` is kept. A value containing itself is never shared, but does not end the walk. Neither argument is mutated.
 *
 * @param prev - The previous value whose references should be retained where possible
 * @param next - The newly computed value
 * @returns - `prev` when the values are deeply equal, otherwise `next` (or a copy of it) sharing every unchanged
 *   subtree with `prev`
 */
export default function replaceEqualDeep<T>(prev: unknown, next: T): T;
export default function replaceEqualDeep(prev: unknown, next: unknown): unknown {
  return shareUnchanged(prev, next, []);
}
