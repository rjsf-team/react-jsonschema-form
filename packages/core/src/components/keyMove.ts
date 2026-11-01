import type { ErrorSchema, FieldPath, FieldPathList, GenericObjectType, ValidationData } from '@rjsf/utils';
import {
  ERRORS_KEY,
  fieldPathFromList,
  fieldPathToList,
  getByPath,
  isPlainObject,
  mergeObjects,
  propertyToPath,
  replaceEqualDeep,
  setByPath,
  setOwn,
} from '@rjsf/utils';

import { ADDITIONAL_PROPERTY_KEY_REMOVE } from './constants.ts';
import { copyAlongPath, getAt, isPathPrefix, replaceErrorSchemaNode } from './dataPaths.ts';
import type { FieldChange } from './formState.ts';

/** Where a change put what an array or object held under `key`: the new key, or `undefined` when it is gone */
export type KeyMove = (key: string) => string | undefined;

/** The `KeyMove` of an array whose items went where `newIndexOf` says, `undefined` for one that was removed. A key that
 * names no item stays where it is
 */
export function moveOfItems(newIndexOf: (index: number) => number | undefined): KeyMove {
  return (key) => (/^(0|[1-9]\d*)$/.test(key) ? newIndexOf(Number(key))?.toString() : key);
}

/** The array or object whose keys a change moves, and where each goes */
export interface ContainerKeyMove {
  container: FieldPath;
  newKeyOf: KeyMove;
}

/** What a move `transformChange` rewrote left under a key of the container it moved: what the move put there,
 * `'moved'`, what was there before it, `'unmoved'`, or neither, `'none'`
 */
export type MoveFate = 'moved' | 'unmoved' | 'none';

/** What became of a change that moved keys, see `FormDataAccess.sendMove()`: refused by `transformChange`, which leaves
 * the keys where they were, or stored, with `kept`, what the form stored at the change's path. A change `transformChange`
 * rewrote also has `edited`, what the change alone would have left there, for a field to tell which of the keys it
 * moved still hold what it moved there
 */
export type MoveOutcome =
  | { kind: 'refused' }
  | { kind: 'taken'; kept: unknown }
  | { kind: 'rewritten'; kept: unknown; edited: unknown };

/** A `KeyMove` with the path of the array or object whose keys it moved */
export interface AnnouncedMove {
  fieldPath: FieldPath;
  /** The value the field sends with the move. A change at `fieldPath` that brings another value, which a custom parent
   * field put in its place, is not the change the move describes, so it moves nothing
   */
  value: unknown;
  /** Where each key went. A change that moves no key, such as a property's removal, leaves it out: it is announced only
   * so the field learns what became of it
   */
  newKeyOf?: KeyMove;
  /** Where the fields' own errors under each key went, when not where the validator's did: an option switch drops
   * what was raised under a key the new option declares too, since another widget renders for it, while the
   * validator's errors there describe a constraint the new option may well share
   */
  newOwnKeyOf?: KeyMove;
  /** Whether the errors raised at `fieldPath` itself go with the move. A reorder or rename leaves the array or object
   * that raised them in place, so they stay; an option switch renders another field at the path, so a raise of the
   * option's widget would be shown by one that never made it
   */
  dropsOwnErrors?: boolean;
}

/** Where the change at `fieldPath` moves what the form keeps by path of the fields under a container, as the option
 * selections: under the keys of the container the move announced for it moved, where the fields' own errors go, or out
 * from under a property the change removes
 *
 * @param change - The change, with the key move announced for it, if any
 * @returns - The container whose keys move and where each goes, or undefined for a change that moves none
 */
export function keyMoveOf<T>({
  fieldPath,
  newValue,
  newKeyOf,
  newOwnKeyOf,
}: Pick<FieldChange<T>, 'fieldPath' | 'newValue' | 'newKeyOf' | 'newOwnKeyOf'>): ContainerKeyMove | undefined {
  const ownKeyOf = newOwnKeyOf ?? newKeyOf;
  if (ownKeyOf) {
    return { container: fieldPath, newKeyOf: ownKeyOf };
  }
  if (newValue !== ADDITIONAL_PROPERTY_KEY_REMOVE) {
    return undefined;
  }
  const path = fieldPathToList(fieldPath);
  if (path.length > 0) {
    const removed = String(path[path.length - 1]);
    return { container: fieldPathFromList(path.slice(0, -1)), newKeyOf: (key) => (key === removed ? undefined : key) };
  }
  return undefined;
}

/** The fate of each key of a container a rewritten move moved, see `MoveFate`, from what the form `kept` there, what
 * the move alone left, `moved`, and what was there `before`. Each side's member is shared against `kept`'s, so an equal
 * copy compares by reference
 */
export function moveFateOf(kept: unknown, moved: unknown, before: unknown): (key: string) => MoveFate {
  // Compared only for the keys asked about, the ones that hold marks or selections, not across the whole container
  const isKeptFrom = (side: unknown, key: string) => {
    const member = getByPath(side, key);
    return Object.is(replaceEqualDeep(member, getByPath(kept, key)), member);
  };
  return (key) => {
    if (isKeptFrom(moved, key)) {
      return 'moved';
    }
    return isKeptFrom(before, key) ? 'unmoved' : 'none';
  };
}

/** `data` with what the array or object at `path` holds where `newKeyOf` put it: diffed against `changed`, a moved
 * value is no change, so the errors that moved with a key are kept and those of a value that is gone are not. An array
 * also holds the items `changed` added, so an add or a copy is no change either: no error sits under an index that
 * held nothing, and the array's own errors stay for the next validation as they do through a remove or a reorder,
 * whether or not the new item has a value. A property an object gained is a change, since the validator may have
 * reported it missing.
 */
export function withKeysMoved(data: unknown, changed: unknown, path: FieldPathList, newKeyOf: KeyMove): unknown {
  const held = getAt<unknown>(data, path);
  const newHeld = getAt<unknown>(changed, path);
  let moved: unknown;
  if (Array.isArray(held) && Array.isArray(newHeld)) {
    const items: unknown[] = [...newHeld];
    held.forEach((item, index) => {
      // A removed item has no new key
      const newKey = newKeyOf(String(index));
      if (newKey !== undefined && Number(newKey) < items.length) {
        items[Number(newKey)] = item;
      }
    });
    moved = items;
  } else if (isPlainObject(held) && isPlainObject(newHeld)) {
    const properties: GenericObjectType = {};
    for (const [key, value] of Object.entries(held)) {
      const newKey = newKeyOf(key);
      if (newKey !== undefined) {
        setOwn(properties, newKey, value);
      }
    }
    moved = properties;
  } else {
    return data;
  }
  return path.length === 0 ? moved : setByPath(copyAlongPath(data, path), path, moved);
}

/** `errorSchema` after the keys of the array or object at `path` moved: the errors under each key sit under its new
 * one and those under a key that is gone are gone. Its own, such as `minItems`, belong to no key and stay
 */
export function moveErrorSchemaKeys<T>(
  errorSchema: ErrorSchema<T>,
  path: FieldPathList,
  newKeyOf: KeyMove,
): ErrorSchema<T> {
  const moved: ErrorSchema = {};
  for (const [key, node] of Object.entries(getAt<ErrorSchema | undefined>(errorSchema, path) ?? {})) {
    const newKey = key === ERRORS_KEY ? key : newKeyOf(key);
    if (newKey !== undefined) {
      // A rename onto a key that holds errors, such as a declared property the data lacks, keeps both
      setOwn(moved, newKey, Object.hasOwn(moved, newKey) ? mergeObjects(moved[newKey], node, true) : node);
    }
  }
  return replaceErrorSchemaNode(errorSchema, path, moved);
}

/** `validation` after the keys of the array or object at `path` moved, the list by the rule `moveErrorSchemaKeys()`
 * moves the `ErrorSchema` by. A moved error keeps what the validator said of it, under its new `property`
 */
export function moveErrorKeys<T>(
  validation: ValidationData<T>,
  path: FieldPathList,
  newKeyOf: KeyMove,
): ValidationData<T> {
  const errors = validation.errors.flatMap((error) => {
    const pathOfError = propertyToPath(error.property);
    const key = isPathPrefix(path, pathOfError) ? pathOfError[path.length] : undefined;
    const newKey = key === undefined ? key : newKeyOf(key);
    if (newKey === key) {
      return [error];
    }
    if (newKey === undefined) {
      return [];
    }
    const property = `.${[...pathOfError.slice(0, path.length), newKey, ...pathOfError.slice(path.length + 1)].join('.')}`;
    // A stack that names the field by its title instead of its `property` says nothing of the key
    const isStackOfProperty = error.stack === `${error.property} ${error.message}`;
    return [{ ...error, property, stack: isStackOfProperty ? `${property} ${error.message}` : error.stack }];
  });
  return { errors, errorSchema: moveErrorSchemaKeys(validation.errorSchema, path, newKeyOf) };
}

/** `paths` with each moved as `movedPath()` moves it, without those under a key that went */
export function movedPaths(paths: ReadonlySet<FieldPath>, container: FieldPathList, newKeyOf: KeyMove): Set<FieldPath> {
  return new Set([...paths].flatMap((path) => movedPath(path, container, newKeyOf) ?? []));
}

/** The new path of `path` once the keys of the array or object at `container` moved as `newKeyOf` says, undefined for
 * one under a key that went, and `path` itself for one outside `container`
 */
export function movedPath(path: FieldPath, container: FieldPathList, newKeyOf: KeyMove): FieldPath | undefined {
  const segments = fieldPathToList(path);
  if (segments.length === container.length || !isPathPrefix(container, segments)) {
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
