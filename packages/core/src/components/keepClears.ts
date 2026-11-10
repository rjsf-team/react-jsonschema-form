import type { FieldPath, FieldPathList } from '@rjsf/utils';
import { fieldPathFromList, fieldPathToList, isPlainObject, setByPath } from '@rjsf/utils';

import { copyAlongPath, getAt } from './dataPaths.ts';

/** Whether `container` holds a clear under `key`: an object's own key holding `undefined`, or a `null` array item, as a
 * cleared item is written
 */
export function holdsClear(container: unknown, key: string | number): boolean {
  if (Array.isArray(container)) {
    return Number(key) < container.length && container[Number(key)] === null;
  }
  return isPlainObject(container) && Object.hasOwn(container, key) && container[key] === undefined;
}

/** Whether `data` holds a clear at `path`, see `holdsClear()`. The root holds none: it is no key of a container */
export function holdsClearAt(data: unknown, path: FieldPathList): boolean {
  return path.length > 0 && holdsClear(getAt<unknown>(data, path.slice(0, -1)), path[path.length - 1]);
}

/** Whether `container` holds a value under `key` that a clear there would replace */
export function holdsValue(container: unknown, key: string | number): boolean {
  if (Array.isArray(container)) {
    return Number(key) < container.length && container[Number(key)] !== null;
  }
  return isPlainObject(container) && Object.hasOwn(container, key) && container[key] !== undefined;
}

/** `derived` with each clear at `clearedPaths` that `written` still holds kept: a field the user cleared, in this change
 * or an earlier one, stays cleared whatever defaults the derivation merged in (#5125), such as under
 * `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'`. A clear holds only while `written` holds it, see
 * `holdsClear()`, so a key dropped or given a value gives way to its defaults
 *
 * @param derived - The data the derivation filled
 * @param written - The data the derivation filled it from
 * @param clearedPaths - The paths of the clears to keep
 * @returns - `derived`, sharing every subtree that holds no kept clear
 */
export function keepRecordedClears<V>(derived: V, written: unknown, clearedPaths: Iterable<FieldPath>): V {
  let kept = derived;
  if (Object.is(derived, written)) {
    return kept;
  }
  for (const fieldPath of clearedPaths) {
    const path: FieldPathList = fieldPathToList(fieldPath);
    const container = getAt<unknown>(kept, path.slice(0, -1));
    if (holdsClearAt(written, path) && holdsValue(container, path[path.length - 1])) {
      kept = setByPath(copyAlongPath(kept, path), path, Array.isArray(container) ? null : undefined);
    }
  }
  return kept;
}

/** The paths of the clears in `value`, at `path`: each of its own keys holding `undefined` and each `null` item, the
 * items and the values of its keys included
 */
export function clearsIn(value: unknown, path: FieldPathList): FieldPath[] {
  if (!Array.isArray(value) && !isPlainObject(value)) {
    return [];
  }
  return Object.keys(value).flatMap((key) => {
    const at = [...path, Array.isArray(value) ? Number(key) : key];
    return holdsClear(value, key) ? [fieldPathFromList(at)] : clearsIn(Reflect.get(value, key), at);
  });
}
