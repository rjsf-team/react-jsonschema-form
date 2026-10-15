import type { FieldPath, FieldPathList } from '@rjsf/utils';
import { deepEquals, fieldPathFromList, fieldPathToList } from '@rjsf/utils';

import type { KeyMove } from './formState.ts';

/** The option selected for a field's option list, with the field's data as the form last left it there: data that
 * differs arrived from outside the field, see `useOptionSelection()`
 */
export interface OptionSelection {
  readonly index: number;
  readonly data: unknown;
}

/** The new path of `path` once the keys of the array or object at `container` moved as `newKeyOf` says, undefined for
 * one under a key that went, and `path` itself for one outside `container`
 */
function movedPath(path: FieldPath, container: FieldPathList, newKeyOf: KeyMove): FieldPath | undefined {
  const segments = fieldPathToList(path);
  const isUnder = segments.length > container.length && container.every((segment, i) => segments[i] === segment);
  if (!isUnder) {
    return path;
  }
  const key = segments[container.length];
  const newKey = newKeyOf(String(key));
  if (newKey === undefined) {
    return undefined;
  }
  const moved = [...segments];
  moved[container.length] = typeof key === 'number' ? Number(newKey) : newKey;
  return fieldPathFromList(moved);
}

/** Whether `path` is `edited` or one of its ancestors */
function isAtOrAbove(path: FieldPath, edited: FieldPathList): boolean {
  const segments = fieldPathToList(path);
  return segments.length <= edited.length && segments.every((segment, i) => edited[i] === segment);
}

/** The state of a form that is about what it shows rather than the data: the option selected for each option list, by
 * the path of the field offering it and the list, and which collapsed `$ref` cycles are expanded, by path. It lives as
 * long as the form, so a field that unmounts and mounts again finds its selection, and follows the moves of array items
 * and object keys the form is told of, as the errors do.
 */
export function createUiState() {
  let selections = new Map<FieldPath, ReadonlyMap<string, OptionSelection>>();
  let expanded = new Set<FieldPath>();
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const setSelection = (path: FieldPath, list: string, selection: OptionSelection) => {
    selections = new Map(selections).set(path, new Map(selections.get(path)).set(list, selection));
  };
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    selection: (path: FieldPath, list: string): OptionSelection | undefined => selections.get(path)?.get(list),
    /** Selects option `index` of `list` at `path`, for the field's `data` as it is */
    select: (path: FieldPath, list: string, index: number, data: unknown) => {
      const current = selections.get(path)?.get(list);
      if (current?.index === index && current.data === data) {
        return;
      }
      setSelection(path, list, { index, data });
      if (current?.index !== index) {
        notify();
      }
    },
    /** Records the option shown for `data` before an edit inside the field, unless the selection already describes that
     * data: the edit must not change which option the data is shown under
     */
    keep: (path: FieldPath, list: string, index: number, data: unknown) => {
      const current = selections.get(path)?.get(list);
      if (current === undefined || !deepEquals(current.data, data)) {
        setSelection(path, list, { index, data });
      }
    },
    /** Records, for every selection at or above the edited `path`, the data the edit left there */
    edited: (path: FieldPath, dataAt: (path: FieldPath) => unknown) => {
      const segments = fieldPathToList(path);
      for (const [at, lists] of selections) {
        if (isAtOrAbove(at, segments)) {
          const data = dataAt(at);
          selections = new Map(selections).set(
            at,
            new Map([...lists].map(([list, { index }]) => [list, { index, data }])),
          );
        }
      }
    },
    isExpanded: (path: FieldPath) => expanded.has(path),
    expand: (path: FieldPath) => {
      expanded = new Set(expanded).add(path);
      notify();
    },
    /** Moves the selections and expansions under the array or object at `container` as its keys moved */
    move: (container: FieldPath, newKeyOf: KeyMove) => {
      const containerSegments = fieldPathToList(container);
      const movedSelections = new Map<FieldPath, ReadonlyMap<string, OptionSelection>>();
      for (const [path, lists] of selections) {
        const to = movedPath(path, containerSegments, newKeyOf);
        if (to !== undefined) {
          movedSelections.set(to, lists);
        }
      }
      selections = movedSelections;
      expanded = new Set([...expanded].flatMap((path) => movedPath(path, containerSegments, newKeyOf) ?? []));
      notify();
    },
    clear: () => {
      selections = new Map();
      expanded = new Set();
      notify();
    },
  };
}

export type UiState = ReturnType<typeof createUiState>;
