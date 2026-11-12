import type { FieldPath } from '@rjsf/utils';
import { fieldPathFromList, fieldPathToList } from '@rjsf/utils';

import type { ContainerKeyMove } from './keyMove.ts';
import { movedPath } from './keyMove.ts';

/** Where a value the form keeps a record of came from: a person `'entered'` it, or a seed held it, which says nothing
 * of whether a person or a default put it there
 */
export type RecordedOrigin = 'entered' | 'seeded';

/** The one record of where the values of some data came from: the origin of each value a person entered or a seed
 * held, by its path. A path holds one origin, so no value is both, and a value at a path with no entry is one the
 * defaults filled in. Never changed once made: each function here hands back another map, or the map itself where
 * nothing in it changes, so what is derived from a map is derived once
 */
export type Origins = ReadonlyMap<FieldPath, RecordedOrigin>;

export const NO_ORIGINS: Origins = new Map();

/** `origins` without the origin of each path of `gone`, and with each path of `entered` recorded as entered
 *
 * @param origins - The origins recorded so far
 * @param gone - The paths whose values the data no longer holds, or holds another value at
 * @param [entered=[]] - The paths of the values entered, which are recorded whether or not they are in `gone`
 * @param [only] - The one origin a path of `gone` loses, where a path of any other keeps its own
 * @returns - The origins, `origins` itself when it records all of that already
 */
export function withOrigins(
  origins: Origins,
  gone: readonly FieldPath[],
  entered: readonly FieldPath[] = [],
  only?: RecordedOrigin,
): Origins {
  const kept = new Set(entered);
  const loses = (path: FieldPath) => (only ? origins.get(path) === only : origins.has(path));
  if (
    entered.every((path) => origins.get(path) === 'entered') &&
    !gone.some((path) => !kept.has(path) && loses(path))
  ) {
    return origins;
  }
  const next = new Map(origins);
  gone.filter(loses).forEach((path) => next.delete(path));
  entered.forEach((path) => next.set(path, 'entered'));
  return next;
}

/** `origins` without each `keep` turns down, `origins` itself when it turns none down */
export function filterOrigins(origins: Origins, keep: (fieldPath: FieldPath) => boolean): Origins {
  const kept = [...origins].filter(([path]) => keep(path));
  return kept.length === origins.size ? origins : new Map(kept);
}

/** `origins` once the keys of the container `move` names moved: each origin goes where its value went, and one under a
 * key that went goes with it. Where two values end at one path, an entered one is what the path records
 *
 * @param origins - The origins before the move
 * @param move - Where the keys of a container moved, if any did
 * @returns - The origins after the move, `origins` itself when it records the same after it
 */
export function movedOrigins(origins: Origins, move: ContainerKeyMove | undefined): Origins {
  if (!move || origins.size === 0) {
    return origins;
  }
  const container = fieldPathToList(move.container);
  const moved = new Map<FieldPath, RecordedOrigin>();
  origins.forEach((origin, path) => {
    const to = movedPath(path, container, move.newKeyOf);
    if (to !== undefined && moved.get(to) !== 'entered') {
      moved.set(to, origin);
    }
  });
  return moved.size === origins.size && [...moved].every(([path, origin]) => origins.get(path) === origin)
    ? origins
    : moved;
}

const originsAlong = new WeakMap<Origins, Origins>();

/** The origin of each path of `origins` and of every array and object holding it, the root's included: an array or
 * object takes the origin of what it holds, entered if a person entered any of it, and else seeded. Built once for a
 * map, so a change that leaves the map as it was builds nothing
 */
export function alongOrigins(origins: Origins): Origins {
  let along = originsAlong.get(origins);
  if (!along) {
    const built = new Map<FieldPath, RecordedOrigin>();
    origins.forEach((origin, fieldPath) => {
      const path = fieldPathToList(fieldPath);
      // Longest first: a path that holds this origin, or the entered one that goes before it, was recorded with every
      // path holding it
      for (let end = path.length; end >= 0; end -= 1) {
        const at = fieldPathFromList(path.slice(0, end));
        const held = built.get(at);
        if (held === origin || held === 'entered') {
          return;
        }
        built.set(at, origin);
      }
    });
    along = built;
    originsAlong.set(origins, along);
  }
  return along;
}
