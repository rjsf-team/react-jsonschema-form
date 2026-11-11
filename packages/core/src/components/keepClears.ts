import type { FieldPathList } from '@rjsf/utils';
import { isPlainObject, setByPath } from '@rjsf/utils';

import { copyAlongPath, getAt } from './dataPaths.ts';

/** Whether `container` holds an entry under `key`: an object's own key, or an item of an array */
function holdsKey(container: unknown, key: string | number): boolean {
  if (Array.isArray(container)) {
    return Number(key) < container.length;
  }
  return isPlainObject(container) && Object.hasOwn(container, key);
}

/** The value that stands for no value: `null` for an array item, as a cleared item is written, and `undefined` for an
 * object's key
 */
export function emptyValue(isItem: boolean): null | undefined {
  return isItem ? null : undefined;
}

/** The value `container` holds under a key that stands for no value, see `emptyValue()` */
function emptyIn(container: unknown): null | undefined {
  return emptyValue(Array.isArray(container));
}

/** Whether `container` holds a clear under `key`: an object's own key holding `undefined`, or a `null` array item */
export function holdsClear(container: unknown, key: string | number): boolean {
  return holdsKey(container, key) && getAt<unknown>(container, [key]) === emptyIn(container);
}

/** Whether `data` holds a clear at `path`, see `holdsClear()`. The root holds none: it is no key of a container */
export function holdsClearAt(data: unknown, path: FieldPathList): boolean {
  return path.length > 0 && holdsClear(getAt<unknown>(data, path.slice(0, -1)), path[path.length - 1]);
}

/** Whether `container` holds a value under `key` that a clear there would replace: neither a clear nor `undefined`, as
 * an item added without a default, or a hole, holds
 */
export function holdsValue(container: unknown, key: string | number): boolean {
  if (!holdsKey(container, key)) {
    return false;
  }
  const value = getAt<unknown>(container, [key]);
  return value !== undefined && value !== emptyIn(container);
}

/** `derived` with each clear at `clearedPaths` that `written` still holds kept: a field the user cleared, in this change
 * or an earlier one, stays cleared whatever defaults the derivation merged in (#5125), such as under
 * `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'`. A clear holds only while `written` holds it, see
 * `holdsClear()`, so a key dropped or given a value gives way to its defaults
 *
 * @param derived - The data the derivation filled
 * @param written - The data the derivation filled it from
 * @param clearedPaths - The paths of the clears to keep
 * @returns - `derived`, sharing every subtree that holds no kept clear, with each container copied at most once
 */
export function keepRecordedClears<V>(derived: V, written: unknown, clearedPaths: Iterable<FieldPathList>): V {
  let kept = derived;
  if (Object.is(derived, written)) {
    return kept;
  }
  const copies = new WeakSet<object>();
  for (const path of clearedPaths) {
    const container = getAt<unknown>(kept, path.slice(0, -1));
    if (holdsClearAt(written, path) && holdsValue(container, path[path.length - 1])) {
      kept = setByPath(copyAlongPath(kept, path, copies), path, emptyIn(container));
    }
  }
  return kept;
}

/** Adds to `found` the path of each clear `value`, at `path`, holds, see `holdsClear()`, those of its items and of the
 * values of its keys included, that `isKept` takes of the container `held` holds at the same path. A subtree `held`
 * holds the same reference at is skipped, and below a container `held` doesn't hold one of the same kind at, `isKept`
 * is asked of `undefined`
 */
function collectClears(
  value: unknown,
  held: unknown,
  path: FieldPathList,
  isKept: (heldContainer: unknown, key: string) => boolean,
  found: FieldPathList[],
): FieldPathList[] {
  const isArray = Array.isArray(value);
  if ((!isArray && !isPlainObject(value)) || Object.is(value, held)) {
    return found;
  }
  const heldContainer = (isArray ? Array.isArray(held) : isPlainObject(held)) ? held : undefined;
  for (const key of Object.keys(value)) {
    const at = [...path, isArray ? Number(key) : key];
    if (holdsClear(value, key)) {
      if (isKept(heldContainer, key)) {
        found.push(at);
      }
    } else {
      collectClears(getAt<unknown>(value, [key]), getAt<unknown>(heldContainer, [key]), at, isKept, found);
    }
  }
  return found;
}

/** The paths of the clears in `value`, at `path`: each of its own keys holding `undefined` and each `null` item, the
 * items and the values of its keys included. An item's last segment is its index, a number, and a key's is the key
 */
export function clearsIn(value: unknown, path: FieldPathList): FieldPathList[] {
  return collectClears(value, undefined, path, () => true, []);
}

/** The paths of the clears `written`, the array or object a field wrote at `path`, makes over `held`, the one it
 * replaced: each key or item it leaves without a value that held one there, see `holdsValue()`. The two are paired by
 * key, an array's items by index, since a write of a whole value says nothing of where its items came from
 */
export function clearsWrittenOver(written: unknown, held: unknown, path: FieldPathList): FieldPathList[] {
  return collectClears(written, held, path, holdsValue, []);
}
