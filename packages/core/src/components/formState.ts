import type {
  ErrorSchema,
  FieldPath,
  FieldPathList,
  FormContextType,
  GenericObjectType,
  StrictRJSFSchema,
  RJSFSchema,
  SchemaContext,
  SchemaUtilsType,
  UiSchema,
  ValidationData,
} from '@rjsf/utils';
import {
  getByPath,
  hasByPath,
  setByPath,
  propertyToPath,
  toPath,
  toFieldPath,
  unsetByPath,
  createSchemaUtils,
  deepEquals,
  deepEqualsUndefinedAsMissing,
  errorSchemaChild,
  getChangedFields,
  getUiOptions,
  hashObject,
  isObject,
  isPlainObject,
  mergeObjects,
  pickGlobalUiOptions,
  replaceEqualDeep,
  setOwn,
  toErrorList,
  fieldPathToList,
  UI_GLOBAL_OPTIONS_KEY,
  UI_OPTIONS_KEY,
  validationDataMerge,
  fieldPathFromList,
  ERRORS_KEY,
  SCHEMA_KEY,
} from '@rjsf/utils';

import isDevelopment from '../isDevelopment.ts';
import { buildRegistry } from '../Theme.ts';
import { ADDITIONAL_PROPERTY_KEY_REMOVE } from './constants.ts';
import { schemaFieldDrawsControlsBesideOptions } from './fields/SchemaField.tsx';
import type { FormProps, FormState } from './Form.tsx';
import type { EventFormData, IChangeEvent, NestedBooleans, RJSFFormStatus } from './IChangeEvent.ts';
import type { FieldTree } from './sanitizeFieldTree.ts';
import sanitizeFieldTree from './sanitizeFieldTree.ts';
import type { UiStateReader } from './uiState.ts';
import {
  asFieldValue,
  createUiState,
  fieldStateOf,
  isPathPrefix,
  movedPaths,
  settledEntries,
  withoutSelections,
  withSelectionsAsOf,
  withSelectionsHeldFor,
} from './uiState.ts';

/* The pure half of `Form`: what its state is derived from, and what each operation makes of it.
 */

/** The validation half of the state */
type ErrorState<T> = Pick<
  FormState<T>,
  'errors' | 'errorSchema' | 'schemaValidationErrors' | 'schemaValidationErrorSchema'
>;

/** The errors a change leaves: those on display, the validator's, and the fields' own they are built from */
type ChangedErrorState<T> = ErrorState<T> & Pick<FormState<T>, 'customErrors'>;

/** The error members of `state` that a change works on */
function errorStateOf<T, S extends StrictRJSFSchema, F extends FormContextType>({
  errors,
  errorSchema,
  schemaValidationErrors,
  schemaValidationErrorSchema,
  customErrors,
}: FormState<T, S, F>): ChangedErrorState<T> {
  return { errors, errorSchema, schemaValidationErrors, schemaValidationErrorSchema, customErrors };
}

/** The form data as an event hands it back. The overload is the one trust point for `EventFormData`'s promise that an
 * object or array root is never `undefined`.
 */
export function toEventFormData<T>(formData: T | undefined): EventFormData<T>;
export function toEventFormData(formData: unknown): unknown {
  return formData;
}

/** What `getDefaultFormState()` fills the root schema's defaults into, as the form's data. The overload is the one
 * trust point that the defaults of the form's own schema are data of the form's type.
 */
function asFilledFormData<T>(filled: unknown): T;
function asFilledFormData(filled: unknown): unknown {
  return filled;
}

/** Where `changed`, a value the form's data holds, differs from `baseline`, which it is not. A value on one side only,
 * or of another kind on each, is marked whole at each of its leaves
 */
function markChanged(changed: unknown, baseline: unknown): unknown {
  if (Array.isArray(changed) && Array.isArray(baseline)) {
    return Array.from({ length: Math.max(changed.length, baseline.length) }, (_, index) =>
      markMember(changed, baseline, index),
    );
  }
  if (isPlainObject(changed) && isPlainObject(baseline)) {
    const marks: GenericObjectType = {};
    for (const key of new Set([...Object.keys(changed), ...Object.keys(baseline)])) {
      const mark = markMember(changed, baseline, key);
      if (mark !== undefined) {
        setOwn(marks, key, mark);
      }
    }
    return marks;
  }
  return markWhole(Array.isArray(changed) || isPlainObject(changed) ? changed : baseline);
}

/** The mark of the member at `key`, undefined where both hold it as the same value or neither holds it, as at a hole
 * in a sparse array
 */
function markMember(changed: object, baseline: object, key: string | number): unknown {
  const isInChanged = Object.hasOwn(changed, key);
  const isInBaseline = Object.hasOwn(baseline, key);
  if (!isInChanged && !isInBaseline) {
    return undefined;
  }
  const changedMember: unknown = Reflect.get(changed, key);
  const baselineMember: unknown = Reflect.get(baseline, key);
  if (isInChanged && isInBaseline) {
    return Object.is(changedMember, baselineMember) ? undefined : markChanged(changedMember, baselineMember);
  }
  return markWhole(isInChanged ? changedMember : baselineMember);
}

/** `true` at every leaf of `value`, for a value only one side holds. An empty object or array is a leaf, so a field
 * added or removed with one is marked
 */
function markWhole(value: unknown): unknown {
  if (Array.isArray(value) && value.length > 0) {
    return value.map(markWhole);
  }
  if (isPlainObject(value) && Object.keys(value).length > 0) {
    const marks: GenericObjectType = {};
    Object.entries(value).forEach(([key, member]) => setOwn(marks, key, markWhole(member)));
    return marks;
  }
  return true;
}

/** The marks `markChanged()` and `markPath()` build, as the `NestedBooleans` of the form's data. The overload is the
 * one trust point that marks built by walking the form's data are shaped like it
 */
function asNestedBooleans<T>(marks: unknown): NestedBooleans<T>;
function asNestedBooleans(marks: unknown): unknown {
  return marks;
}

/** The marks of data that holds none: an empty array or object, or `false` */
function noMarks(formData: unknown): unknown {
  if (Array.isArray(formData)) {
    return [];
  }
  return isPlainObject(formData) ? {} : false;
}

/** `marks` with the field at `path` of `data` marked touched, `true` whether or not it holds a value. An object the
 * data does not hold yet, as one whose fields were blurred but never filled in, is marked as if it were there; a key a
 * change dropped without an announced move is no longer touched, see `withoutDroppedPaths()`. An array item that is not
 * there, or a path through a value that holds no fields, marks nothing. A field marked whole stays `true` whatever is
 * marked inside it, in whichever order the paths are marked. Writes into the containers of `marks`, which the caller
 * built
 *
 * @returns - The marks with the field marked, or undefined when the path marks nothing
 */
function markPath(marks: unknown, data: unknown, path: FieldPathList): unknown {
  if (path.length === 0 || marks === true) {
    return true;
  }
  const [key, ...rest] = path;
  if (Array.isArray(data) ? !hasByPath(data, key) : data !== undefined && !isPlainObject(data)) {
    return undefined;
  }
  let container: GenericObjectType = isPlainObject(marks) ? marks : {};
  if (Array.isArray(data)) {
    container = Array.isArray(marks) ? marks : Array.from({ length: data.length });
  }
  const marked = markPath(getByPath(container, key), getByPath(data, key), rest);
  if (marked === undefined) {
    return undefined;
  }
  setOwn(container, key, marked);
  return container;
}

/** The paths of the leaves `value`, the value at `fieldPath`, holds: `fieldPath` itself for a value that is no array or
 * object, and none for an empty array or object or for no value
 */
function leafPathsOf(value: unknown, fieldPath: FieldPath): FieldPath[] {
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => leafPathsOf(item, toFieldPath(index, fieldPath)));
  }
  if (isPlainObject(value)) {
    return Object.entries(value).flatMap(([key, member]) => leafPathsOf(member, toFieldPath(key, fieldPath)));
  }
  return value === undefined ? [] : [fieldPath];
}

/** The `dirtyFields` of `formData`. The data shares with the baseline every subtree equal to it, see `shareState()`,
 * so the walk descends only into the objects and arrays whose reference differs, comparing each of their members by
 * reference once; no deep comparison runs
 */
function dirtyFieldsOf<T>(formData: T | undefined, baseline: T | undefined): NestedBooleans<T> {
  return asNestedBooleans<T>(Object.is(formData, baseline) ? noMarks(formData) : markChanged(formData, baseline));
}

/** The touched marks of `formData`, or undefined when nothing touched marks a field. The touched fields cost what was
 * touched
 */
function touchedMarksOf(formData: unknown, touchedPaths: TouchedPaths): unknown {
  let marks: unknown;
  touchedPaths.forEach((fieldPath) => {
    marks = markPath(marks, formData, fieldPathToList(fieldPath)) ?? marks;
  });
  return marks;
}

/** The form's status, whose `dirtyFields`, `touched` and `touchedFields` are built on first read, since most events are
 * read without them. The marks are frozen in development as they are built, since `getStatus()` hands the same marks
 * to every reader
 *
 * @param state - The state of the form
 * @param submitCount - How many submits have reached the form since it mounted or was last reset
 * @returns - The status of the form
 */
export function toFormStatus<T>(
  { formData, baseline, touchedPaths }: DataAndBaseline<T> & { touchedPaths: TouchedPaths },
  submitCount: number,
): RJSFFormStatus<T> {
  let dirtyFields: NestedBooleans<T> | undefined;
  let touched = false;
  let touchedFields: NestedBooleans<T> | undefined;
  const buildTouched = () => {
    if (touchedFields === undefined) {
      const marks = touchedMarksOf(formData, touchedPaths);
      // Read off the marks rather than the paths, so a touched path that marks nothing, such as an item path the data
      // no longer holds, cannot report a touch `touchedFields` does not show
      touched = marks !== undefined;
      touchedFields = asNestedBooleans<T>(marks ?? noMarks(formData));
      if (isDevelopment) {
        freezeFormData(touchedFields);
      }
    }
    return touchedFields;
  };
  return {
    dirty: !Object.is(formData, baseline),
    get dirtyFields() {
      if (dirtyFields === undefined) {
        dirtyFields = dirtyFieldsOf(formData, baseline);
        if (isDevelopment) {
          freezeFormData(dirtyFields);
        }
      }
      return dirtyFields;
    },
    get touched() {
      buildTouched();
      return touched;
    },
    get touchedFields() {
      return buildTouched();
    },
    submitCount,
  };
}

/** The fields whose widgets reported a blur, each holding a value of its own. A widget that handles a whole array or
 * object touches the leaves it holds at the blur
 */
export type TouchedPaths = ReadonlySet<FieldPath>;

/** Where `liveValidate`'s trigger fired, for `liveErrors: 'field'`: `fields`, the fields that fired, whose errors show
 * along with those of every array and object holding them, and `containers`, the arrays and objects whose keys a move
 * announced moved, or whose option selector was blurred, whose own errors show, along with those of the containers
 * holding them, but not the errors of the fields inside them. `all` is set once a validation the form was asked for,
 * `validateForm()` or a submit, showed every error
 */
export interface RevealedPaths {
  readonly fields: ReadonlySet<FieldPath>;
  readonly containers: ReadonlySet<FieldPath>;
  readonly all: boolean;
}

/** What a blur reported for the field at a path touches: `'field'`, the field itself; `'leaves'`, each leaf of an array
 * or object a widget handles whole; `'nothing'`, for a blur of what is no field of the data, such as an option selector
 * or a layout's own component, which only reveals the container's own errors as an option switch does
 */
export type BlurTouch = 'field' | 'leaves' | 'nothing';

/** A blur on its way to the form, from the innermost `SchemaField` above the widget that reported it */
export interface FieldBlur {
  fieldPath: FieldPath;
  touches: BlurTouch;
}

/** A blur and the form's data when it reached the form */
export interface BlurAtData<T> extends FieldBlur {
  dataAtBlur: T | undefined;
}

const NO_PATHS: ReadonlySet<FieldPath> = new Set();

const NOTHING_REVEALED: RevealedPaths = { fields: NO_PATHS, containers: NO_PATHS, all: false };

/** Whether a change from `previous` to `next` dropped the key at `fieldPath` or one above it, see
 * `withoutDroppedPaths()`
 */
function isPathDropped(fieldPath: FieldPath, previous: unknown, next: unknown): boolean {
  let before = previous;
  let after = next;
  for (const key of fieldPathToList(fieldPath)) {
    if (Object.is(before, after) || !hasByPath(before, key)) {
      return false;
    }
    if (!hasByPath(after, key)) {
      return true;
    }
    before = getByPath(before, key);
    after = getByPath(after, key);
  }
  return false;
}

/** `paths` without those under a key `previous` held that `next` does not: a change that dropped a key without
 * announcing a move, as `setFieldValue()` writing over a whole object does, leaves no field there to keep a mark for,
 * so a key added again later starts untouched. A field the data never held a value for, as one blurred while empty, is
 * kept. Costs what the paths hold, and is skipped while the data is unchanged
 *
 * @param paths - The paths to prune
 * @param previous - The data before the change
 * @param next - The data after it, with any keys it announced moving moved already
 * @returns - The paths still held, `paths` itself when none was dropped
 */
function withoutDroppedPaths(paths: ReadonlySet<FieldPath>, previous: unknown, next: unknown): ReadonlySet<FieldPath> {
  if (paths.size === 0 || Object.is(previous, next)) {
    return paths;
  }
  const kept = [...paths].filter((fieldPath) => !isPathDropped(fieldPath, previous, next));
  return kept.length === paths.size ? paths : new Set(kept);
}

/** `paths` with `added` in it, `paths` itself when it holds them already */
function withPaths(paths: ReadonlySet<FieldPath>, ...added: FieldPath[]): ReadonlySet<FieldPath> {
  return added.every((path) => paths.has(path)) ? paths : new Set([...paths, ...added]);
}

/** The array or object whose keys a change moves, and where each goes */
export interface ContainerKeyMove {
  container: FieldPath;
  newKeyOf: KeyMove;
}

/** `paths` once the keys of the container `move` names moved, `paths` itself when none of them moved */
function withPathsMoved(paths: ReadonlySet<FieldPath>, move: ContainerKeyMove | undefined): ReadonlySet<FieldPath> {
  if (!move || paths.size === 0) {
    return paths;
  }
  return sameMembersOr(paths, movedPaths(paths, fieldPathToList(move.container), move.newKeyOf));
}

/** `paths` itself when `next` holds the same paths, so a set whose members did not change keeps its reference, and a
 * set of `next` otherwise
 */
function sameMembersOr(paths: ReadonlySet<FieldPath>, next: Iterable<FieldPath>): ReadonlySet<FieldPath> {
  const nextPaths = new Set(next);
  return nextPaths.size === paths.size && [...nextPaths].every((path) => paths.has(path)) ? paths : nextPaths;
}

/** `revealed` with `fields` and `containers`, `revealed` itself when both are its own */
function withRevealed(
  revealed: RevealedPaths,
  fields: ReadonlySet<FieldPath>,
  containers: ReadonlySet<FieldPath>,
): RevealedPaths {
  return fields === revealed.fields && containers === revealed.containers
    ? revealed
    : { ...revealed, fields, containers };
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

/** What a move `transformChange` rewrote left under a key of the container it moved: what the move put there,
 * `'moved'`, what was there before it, `'unmoved'`, or neither, `'none'`
 */
export type MoveFate = 'moved' | 'unmoved' | 'none';

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

/** `state` with the touched and revealed paths under the keys of `container` settled after a move `transformChange`
 * rewrote, as `fateOf` says of each key: a path under a key holding what the move put there stays where the move put
 * it, one under a key holding what it held before the move comes back from `unmoved`, the marks before the move, and
 * any other is dropped
 */
export function withMarksSettled<T, S extends StrictRJSFSchema, F extends FormContextType>(
  state: FormState<T, S, F>,
  unmoved: Pick<FormState<T, S, F>, 'touchedPaths' | 'revealed'>,
  container: FieldPath,
  fateOf: (key: string) => MoveFate,
): FormState<T, S, F> {
  const settle = (moved: ReadonlySet<FieldPath>, before: ReadonlySet<FieldPath>) =>
    sameMembersOr(
      moved,
      settledEntries(moved, before, (path) => path, container, fateOf),
    );
  const { revealed } = state;
  return {
    ...state,
    touchedPaths: settle(state.touchedPaths, unmoved.touchedPaths),
    revealed: withRevealed(
      revealed,
      settle(revealed.fields, unmoved.revealed.fields),
      settle(revealed.containers, unmoved.revealed.containers),
    ),
  };
}

/** Whether `liveErrors: 'field'` decides which errors live validation shows: only with `liveValidate` */
function isRevealedByField<T, S extends StrictRJSFSchema, F extends FormContextType>(props: FormProps<T, S, F>) {
  return props.liveErrors === 'field' && (isLiveValidated(props) || isBlurValidated(props));
}

/** The touched fields and the revealed ones once the data went from `current`'s to `formData`: both follow the keys
 * `move` moved, and lose those dropped without a move, see `withoutDroppedPaths()`
 */
function marksFollowingData<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  formData: T | undefined,
  move?: ContainerKeyMove,
): Pick<FormState<T, S, F>, 'touchedPaths' | 'revealed'> {
  const { touchedPaths, revealed } = current;
  if (touchedPaths.size === 0 && revealed.fields.size === 0 && revealed.containers.size === 0) {
    return { touchedPaths, revealed };
  }
  // The moved paths are checked against the earlier data with the same keys moved, so a path a move re-keyed is checked
  // against the value that moved with it
  const previous = move
    ? withKeysMoved(current.formData, formData, fieldPathToList(move.container), move.newKeyOf)
    : current.formData;
  const follow = (paths: ReadonlySet<FieldPath>) =>
    withoutDroppedPaths(withPathsMoved(paths, move), previous, formData);
  return {
    touchedPaths: follow(touchedPaths),
    revealed: withRevealed(revealed, follow(revealed.fields), follow(revealed.containers)),
  };
}

/** The touched fields and the revealed ones after `change`, which left `formData`: both follow the keys it moved, and
 * lose those it dropped without a move, see `withoutDroppedPaths()`. Under `liveErrors: 'field'`, a change that moved
 * keys, or that a field announced as a move, as an added property is, reveals the container's own errors, and a
 * field's edit under `liveValidate: 'onChange'` reveals the field's. A root write standing for an edit reveals nothing
 * more: the edit revealed what it reached
 */
function marksAfterChange<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  change: FieldChange<T>,
  formData: T | undefined,
  props: FormProps<T, S, F>,
): Pick<FormState<T, S, F>, 'touchedPaths' | 'revealed'> {
  // The marks belong to the data, so they go where the data went, as the validator's errors do, not where the fields'
  // own errors go: a field both options of a switch declare keeps its value, and its marks with it
  const move = keyMoveOf({ ...change, newOwnKeyOf: undefined });
  const followed = marksFollowingData(current, formData, move);
  let { revealed } = followed;
  if (isRevealedByField(props) && !change.editedPath) {
    const container = move?.container ?? (change.isAnnouncedMove ? change.fieldPath : undefined);
    if (container !== undefined) {
      revealed = { ...revealed, containers: withPaths(revealed.containers, container) };
    } else if (change.isFieldEdit && isLiveValidated(props)) {
      revealed = { ...revealed, fields: withPaths(revealed.fields, change.fieldPath) };
    }
  }
  return { ...followed, revealed };
}

/** Whether `liveErrors: 'field'` hides the errors at a path in `state`, or undefined when it hides none: a field's
 * errors are hidden until it or a field inside it fired, or a field above it did, and an array's or object's own until
 * a move fired it or a container inside it. A submit attempt or `validateForm()` reveals every error
 */
function hiddenErrorsOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  { revealed }: Pick<FormState<T, S, F>, 'revealed'>,
): ((path: FieldPathList) => boolean) | undefined {
  if (!isRevealedByField(props) || revealed.all) {
    return undefined;
  }
  return (path) =>
    !parsedPathsOf(revealed.fields).some((field) => isPathPrefix(path, field) || isPathPrefix(field, path)) &&
    !parsedPathsOf(revealed.containers).some((container) => isPathPrefix(path, container));
}

/** The paths of each set of revealed paths, parsed once: a set is never changed once made, and a pass whose validation
 * holds no error parses nothing
 */
const parsedPaths = new WeakMap<ReadonlySet<FieldPath>, FieldPathList[]>();

function parsedPathsOf(paths: ReadonlySet<FieldPath>): FieldPathList[] {
  let parsed = parsedPaths.get(paths);
  if (!parsed) {
    parsed = [...paths].map(fieldPathToList);
    parsedPaths.set(paths, parsed);
  }
  return parsed;
}

/** Converts the full `FormState` into the `IChangeEvent` version by picking out the public values
 *
 * @param state - The state of the form
 * @param submitCount - How many submits have reached the form since it mounted or was last reset
 * @param status - The status provided by the onSubmit
 * @returns - The `IChangeEvent` for the state
 */
export function toIChangeEvent<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(state: FormState<T, S, F>, submitCount: number, status?: IChangeEvent['status']): IChangeEvent<T, S, F> {
  const { schema, uiSchema, schemaUtils, formData, errors, errorSchema } = state;
  // Assigned onto the status, so its getters stay lazy
  return Object.assign(toFormStatus(state, submitCount), {
    schema,
    uiSchema,
    schemaUtils,
    formData: toEventFormData(formData),
    errors,
    errorSchema,
    ...(status !== undefined && { status }),
  });
}

/** The form's data and its baseline */
export interface DataAndBaseline<T> {
  formData?: T;
  baseline?: T;
}

/** Shares the data and the baseline of `next` against `start`'s, the ones they were produced from, so an unchanged
 * member keeps the reference the fields hold, and keeps the rule that makes the form dirty exactly when its data is not
 * its baseline: every subtree of the data equal to its counterpart in the baseline is that counterpart. The data is
 * shared against `start`'s first, then against the baseline where it changed. A baseline that moved is shared against
 * `start`'s data first, so a reset to the data on screen keeps it, and the data is then shared against all of it
 *
 * @param start - The data and the baseline `next` was produced from
 * @param next - The data and the baseline produced
 * @returns - The shared data and baseline
 */
export function shareData<T>(start: DataAndBaseline<T>, next: DataAndBaseline<T>): DataAndBaseline<T> {
  const baseline = Object.is(next.baseline, start.baseline)
    ? start.baseline
    : replaceEqualDeep(start.formData, next.baseline);
  if (Object.is(next.formData, next.baseline)) {
    return { formData: baseline, baseline };
  }
  const sharedWithStart = replaceEqualDeep(start.formData, next.formData);
  // The data `start` holds already shares with an unmoved baseline every subtree equal to it, so only the subtrees
  // the change reached are compared again, however much of the rest differs from the baseline
  const formData = Object.is(baseline, start.baseline)
    ? replaceEqualDeep(baseline, sharedWithStart, start.formData)
    : replaceEqualDeep(baseline, sharedWithStart);
  return { formData, baseline };
}

/** Shares `next` against `start`, the state it was produced from, see `shareData()`
 *
 * @param start - The state `next` was produced from
 * @param next - The state produced
 * @returns - `next`, sharing every unchanged member with `start`, and `start` itself when nothing changed
 */
export function shareState<T, S extends StrictRJSFSchema, F extends FormContextType>(
  start: FormState<T, S, F>,
  next: FormState<T, S, F>,
): FormState<T, S, F> {
  const shared = shareData(start, next);
  return replaceEqualDeep(start, { ...next, ...shared }, shared);
}

/** The data and the baseline an omission commits */
function committedOmission<T>({ formData, omitBaseline }: ExtraDataOmission<T>): DataAndBaseline<T> {
  return { formData, baseline: omitBaseline() };
}

/** `current` with `omission` committed: the touched and revealed fields lose the keys it dropped, as they do for every
 * other change to the data
 */
function withOmission<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  omission: ExtraDataOmission<T>,
): FormState<T, S, F> {
  return { ...current, ...committedOmission(omission), ...marksFollowingData(current, omission.formData) };
}

/** A field change, applied by `applyChangeToData()` and `applyChangeToErrorsOf()` */
export interface FieldChange<T> {
  /** The `FieldPath` into the formData/errorSchema at which the `newValue`/`newErrorSchema` will be set */
  fieldPath: FieldPath;
  /** The new value to set into the formData */
  newValue?: T;
  /** The field's own errors at `fieldPath`, if it raises any */
  newErrorSchema?: ErrorSchema<T>;
  /** For a change that moved what the array or object at `fieldPath` holds, where each key went; the errors under a
   * key go with it
   */
  newKeyOf?: KeyMove;
  /** For a change that moved keys, where the fields' own errors under each key went when not where the validator's
   * did; see `AnnouncedMove`
   */
  newOwnKeyOf?: KeyMove;
  /** For a change that moved keys, whether the errors raised at `fieldPath` itself go too; see `AnnouncedMove` */
  dropsOwnErrors?: boolean;
  /** Whether a field announced the change as a move, as an added property is though it moves no key, so it reaches the
   * array or object at `fieldPath` rather than the fields inside it
   */
  isAnnouncedMove?: boolean;
  /** Whether the fields' own errors stay as they are: a change no field made, such as the data a `transformChange`
   * writes over an edit, says nothing of what any field raised
   */
  keepsOwnErrors?: boolean;
  /** For a root write over an edit, such as `transformChange`'s, the data the edit left: a field it left cleared that
   * the root write leaves without a value too stays cleared whatever defaults the root write merges in, as it did under
   * the edit
   */
  editedData?: T;
  /** For a root write that stands for an edit, as the data a `transformChange` writes over one does, the path of the
   * field the edit changed: the write is sanitized for a schema its data switches as the edit would be, with the value
   * at that path the user's. Any other root write, such as `setFieldValue('', data)`, is taken as written
   */
  editedPath?: FieldPathList;
  /** Whether a field made the change, or the edit a root write such as `transformChange`'s stands for, so the fields
   * above it, the root's included, keep the options they show for the data it leaves; data set from outside, as
   * `setFieldValue()` sets it, is matched again
   */
  isFieldEdit?: boolean;
}

/** What became of a change that moved keys, see `FormDataAccess.sendMove()`: refused by `transformChange`, which leaves
 * the keys where they were, or stored, with `kept`, what the form stored at the change's path. A change `transformChange`
 * rewrote also has `edited`, what the change alone would have left there, for a field to tell which of the keys it
 * moved still hold what it moved there
 */
export type MoveOutcome =
  | { kind: 'refused' }
  | { kind: 'taken'; kept: unknown }
  | { kind: 'rewritten'; kept: unknown; edited: unknown };

/** Where a change put what an array or object held under `key`: the new key, or `undefined` when it is gone */
export type KeyMove = (key: string) => string | undefined;

/** A change being made to the data: its path, and where it moved the keys of the array or object there, if it moved
 * any
 */
export interface FieldEdit {
  path: FieldPathList;
  newKeyOf?: KeyMove;
}

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

/** The `KeyMove` of an array whose items went where `newIndexOf` says, `undefined` for one that was removed. A key that
 * names no item stays where it is
 */
export function moveOfItems(newIndexOf: (index: number) => number | undefined): KeyMove {
  return (key) => (/^(0|[1-9]\d*)$/.test(key) ? newIndexOf(Number(key))?.toString() : key);
}

/** The part of the state that rendering derives from the props and the data alone: the schema utilities, the root and
 * resolved schemas, the uiSchema and the registry. Error bookkeeping is the rest of `FormState`.
 */
type RenderContext<T, S extends StrictRJSFSchema, F extends FormContextType> = Pick<
  FormState<T, S, F>,
  | 'schemaUtils'
  | 'schema'
  | 'uiSchema'
  | 'retrievedSchema'
  | 'uiState'
  | 'registry'
  | 'validationProps'
  | 'defaultsBehavior'
  | 'allowsAbsentAdditionalProperties'
>;

/** Keeps the previous `schemaUtils` unless the props it was built from changed */
function resolveSchemaUtils<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  prev: Pick<RenderContext<T, S, F>, 'schemaUtils'> | undefined,
): SchemaUtilsType<T, S, F> {
  const { schema, validator, defaultFormStateBehavior, customMergeAllOf, additionalPropertiesWhenAbsent } = props;
  const schemaContext: SchemaContext<S, F> = {
    validator,
    defaultFormStateBehavior,
    customMergeAllOf,
    additionalPropertiesWhenAbsent,
  };
  if (prev && !prev.schemaUtils.doesSchemaUtilsDiffer(schemaContext, schema)) {
    return prev.schemaUtils;
  }
  return createSchemaUtils<T, S, F>(schemaContext, schema);
}

const UI_EMPTY_VALUE_KEY = 'ui:emptyValue';

/** The `ui:emptyValue`s of `uiSchema`, each where it sits: the one part of a uiSchema the defaults of a re-derive are
 * computed from, since `ui:initialValue` applies on mount and `reset()` only. Anything else it holds, a title or a
 * widget written inline, leaves the data as it is (#5294)
 *
 * @param uiSchema - The uiSchema, or the part of one, to collect from
 * @returns - An object mirroring `uiSchema` down to each `emptyValue`, or undefined when it has none
 */
function emptyValuesOf(uiSchema: unknown): unknown {
  // ponytail: a function-form `items` is skipped, so an `emptyValue` it returns never triggers a re-derive
  if (!isPlainObject(uiSchema) && !Array.isArray(uiSchema)) {
    return undefined;
  }
  const found: GenericObjectType = {};
  // Read the way `getDefaultFormState()` reads it, so the two cannot disagree about where an `emptyValue` is
  const { emptyValue } = Array.isArray(uiSchema) ? {} : getUiOptions(uiSchema as UiSchema);
  if (emptyValue !== undefined) {
    found[UI_EMPTY_VALUE_KEY] = emptyValue;
  }
  Object.entries(uiSchema).forEach(([key, value]) => {
    if (key === UI_EMPTY_VALUE_KEY || key === UI_OPTIONS_KEY) {
      return;
    }
    const nested = emptyValuesOf(value);
    if (nested !== undefined) {
      setOwn(found, key, nested);
    }
  });
  return Object.keys(found).length > 0 ? found : undefined;
}

/** Derives the `RenderContext` for the given `props` and resolved schema. The result is shared against `prev`, so a
 * value the parent rebuilt but did not change keeps the reference the fields already hold, functions included: a
 * changed template, widget or field is not mistaken for the old one, and the validator's compiled-schema cache and
 * the sanitize check, which compare the retrieved schema by reference, see the same object while it is unchanged.
 *
 * @param props - The current props
 * @param retrievedSchema - The schema resolved for the data the context is derived for
 * @param prev - The previous context, or the state holding one, whose references are retained where possible
 * @param schemaUtils - The schema utilities for `props`, already resolved by the caller
 * @returns - The render context for the inputs
 */
function deriveRenderContext<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  retrievedSchema: S,
  prev: RenderContext<T, S, F> | undefined,
  schemaUtils: SchemaUtilsType<T, S, F>,
): RenderContext<T, S, F> {
  // Defaulted the way `doesSchemaUtilsDiffer()` defaults it, so going from no settings to `{}` is not a change either
  const { uiSchema = {}, customValidate, transformErrors, defaultFormStateBehavior = {} } = props;
  const rootSchema = schemaUtils.getRootSchema();
  // Shared before `replaceEqualDeep()` sees it, which compares a function by identity: an `arrayMinItems`
  // `computeSkipPopulate` written inline would then make every render look like a change of the settings. Settings
  // that spell a key out as `undefined` are the settings that leave it out
  const defaultsBehavior =
    prev && deepEqualsUndefinedAsMissing(prev.defaultsBehavior, defaultFormStateBehavior)
      ? prev.defaultsBehavior
      : defaultFormStateBehavior;
  return replaceEqualDeep(prev, {
    schemaUtils,
    schema: rootSchema,
    uiSchema,
    retrievedSchema,
    uiState: prev?.uiState ?? createUiState(),
    registry: buildRegistry(props, rootSchema, schemaUtils),
    validationProps: { customValidate, transformErrors },
    defaultsBehavior,
    allowsAbsentAdditionalProperties: props.additionalPropertiesWhenAbsent === 'allow',
  });
}

/** Merges any `extraErrors` or `customErrors` into the given `schemaValidation` object, returning the result
 *
 * @param schemaValidation - The `ValidationData` object into which additional errors are merged
 * @param [extraErrors] - The extra errors from the props
 * @param [customErrors] - The customErrors from custom components
 * @param [isHidden] - Whether `liveErrors: 'field'` hides the validator's errors at a path, see `hiddenErrorsOf()`
 * @return - The `extraErrors` and `customErrors` merged into the shown `schemaValidation`
 */
function mergeErrors<T>(
  schemaValidation: ValidationData<T>,
  extraErrors?: ErrorSchema<T>,
  customErrors?: ErrorSchema<T>,
  isHidden?: (path: FieldPathList) => boolean,
): ValidationData<T> {
  // A result holding no errors has none to hide, so a valid form skips the walk
  const shown =
    isHidden && schemaValidation.errors.length > 0 ? withoutErrors(schemaValidation, isHidden) : schemaValidation;
  // With `preventDuplicates`, a message a field already carries is shown on it once and listed once, the raised errors
  // after the validator's and `extraErrors`
  const withExtra = validationDataMerge(shown, extraErrors, true);
  const { errors, errorSchema } = validationDataMerge(withExtra, customErrors, true);
  return { errors, errorSchema };
}

/** Validates the `formData` against the `schema` using the `schemaUtils` and the validation props, returning the
 * results.
 *
 * @param props - The props holding `customValidate`, `transformErrors`, `uiSchema` and `formContext`
 * @param context - The render context to validate with: its `schemaUtils` runs the validator and its `schema` is the
 *          constraint set. Its `retrievedSchema` is deliberately NOT used: whether the resolved schema may stand in
 *          for the root is the caller's to decide, which is what the separate parameter below is for.
 * @param formData - The form data to validate
 * @param [retrievedSchema] - An optionally pre-resolved schema to validate against instead of the context's `schema`
 * @param [heldPath] - The path whose field and the fields above it keep the options they show, see `heldPathOf()`
 */
export function validateFormData<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  context: RenderContext<T, S, F>,
  formData: T | undefined,
  retrievedSchema?: S,
  heldPath?: FieldPathList,
): ValidationData<T> {
  const { schemaUtils, schema } = context;
  const { customValidate, transformErrors, uiSchema, formContext } = props;
  // When a pre-resolved schema is provided (e.g., from live validation), use it directly.
  // Otherwise validate against the original schema so AJV sees the full constraint set.
  const validationSchema = retrievedSchema ?? schema;
  // JSON.stringify drops keys with `undefined` values; JSON.parse on the result gives AJV a clean
  // object that avoids spurious type errors for `type: "string"` fields that were cleared (#4518).
  // Falsy root values (`false`, `0`, `''`) are valid data, so only `undefined` skips the round trip (#5404).
  const serializedFormData = JSON.stringify(formData);
  const validationFormData = serializedFormData === undefined ? undefined : JSON.parse(serializedFormData);
  // The committed registry's fields, not the props', since whether an option is hidden is a question of what renders
  const fieldState = fieldStateOf(
    context.uiState,
    schemaUtils,
    heldPath,
    (fieldPath, fieldSchema, fieldUiSchema, data) =>
      schemaFieldDrawsControlsBesideOptions<T, S, F>(
        context.registry,
        fieldPath,
        fieldSchema,
        fieldUiSchema,
        asFieldValue<T>(data),
      ),
  );

  // The data handed to `customValidate` carries defaults computed here rather than inside the validator, so they honor
  // the `customMergeAllOf` and `defaultFormStateBehavior` this form was given, which a validator has no way to know.
  // They are the schema's defaults rather than this form's current ones: `initialDefaultsGenerated` is deliberately
  // left unset, as it was in v6, so `ui:initialValue` is applied again and a field the user has cleared reaches
  // `customValidate` holding its initial value. A field offering options takes the defaults of the option it shows, as
  // the form's own do. Passed as a function so the work happens only if the validator uses it, and so defaults that
  // come out `undefined` are still an answer rather than looking like no answer at all
  const getCustomValidateFormData = customValidate
    ? () =>
        schemaUtils.getDefaultFormState(
          validationSchema,
          validationFormData,
          true,
          undefined,
          uiSchema,
          undefined,
          fieldState,
        ) as T
    : undefined;
  const schemaValidation = schemaUtils
    .getValidator()
    .validateFormData(
      validationFormData,
      validationSchema,
      customValidate,
      transformErrors,
      uiSchema,
      getCustomValidateFormData,
    );
  // ui:required only exists in the uiSchema, so it is enforced here rather than by rewriting the schema the
  // validator sees: that keeps the submit and live paths, precompiled validators and AJV error paths unchanged.
  // Read off the same props as `uiSchema`, not the context's registry, which lags the props until the form commits
  // them; normalized as `buildRegistry()` does, so a function-form `uiSchema.items` sees what it sees while rendering
  const uiRequiredErrorSchema = schemaUtils.getUiRequiredErrorSchema(
    uiSchema,
    formData,
    undefined,
    pickGlobalUiOptions(uiSchema?.[UI_GLOBAL_OPTIONS_KEY], props.globalUiOptionsKeys),
    formContext ?? ({} as F),
    fieldState,
  );
  return validationDataMerge<T>(schemaValidation, uiRequiredErrorSchema);
}

/** Performs live validation and then returns the errors and error schemas with `extraErrors` and `customErrors`
 * merged in, alongside the validator's own results.
 *
 *
 * @param props - The current props
 * @param context - The render context to validate with; see `validateFormData()`
 * @param formData - The form data to validate
 * @param [customErrors] - The customErrors from custom components
 * @param [retrievedSchema] - The schema resolved for the branch `formData` selects, when it still describes it; the
 *          root schema is the full constraint set, so a resolved schema, which has had the root's `if`,
 *          `dependencies` and `$ref`s folded into it, drops the errors those keywords report (`must match "then"
 *          schema`, the `oneOf` miss) and may stand in only while it describes the data. Omitting extra data keeps
 *          that true, since the fields it drops are by definition not in the schema that selects the branch; a prop
 *          change does not, which is why the derivation passes it only when nothing that resolves it changed.
 * @param [heldPath] - The path whose field and the fields above it keep the options they show, see `heldPathOf()`
 * @param [isHidden] - Whether `liveErrors: 'field'` hides the validator's errors at a path, see `hiddenErrorsOf()`
 * @returns - An object containing `errorSchema`, `errors`, `schemaValidationErrors` and `schemaValidationErrorSchema`
 */
function runLiveValidation<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  context: RenderContext<T, S, F>,
  formData: T | undefined,
  customErrors?: ErrorSchema<T>,
  retrievedSchema?: S,
  heldPath?: FieldPathList,
  isHidden?: (path: FieldPathList) => boolean,
) {
  const schemaValidation = validateFormData(props, context, formData, retrievedSchema, heldPath);
  const { errors: schemaValidationErrors, errorSchema: schemaValidationErrorSchema } = schemaValidation;
  const mergedErrors = mergeErrors(schemaValidation, props.extraErrors, customErrors, isHidden);
  return { ...mergedErrors, schemaValidationErrors, schemaValidationErrorSchema };
}

/** A copy of `errorSchema` without the `__errors` of the nodes `isDropped` names, and without the nodes that hold
 * nothing, an empty `__errors` or a `null` or `undefined` child included, which a raise at an ancestor would read as
 * errors still being there. `path` is that of `errorSchema` itself. An array a raise holds for the items of an array
 * field is copied as the object keyed by index that `toErrorSchema()` builds, which is what the paths here and the
 * merges walk
 */
function pruneErrorSchema(
  errorSchema: ErrorSchema,
  isDropped: (path: FieldPathList) => boolean,
  path: FieldPathList = [],
): ErrorSchema {
  const kept: ErrorSchema = {};
  for (const [key, value] of Object.entries(errorSchema)) {
    if (key === ERRORS_KEY) {
      if (Array.isArray(value) && value.length > 0 && !isDropped(path)) {
        // Copied, so the form does not hold on to an array the field that raised it may go on to change
        kept[key] = [...value];
      }
    } else if (value != null) {
      const node = errorSchemaChild(key, value);
      const child = node ? pruneErrorSchema(node, isDropped, [...path, key]) : value;
      if (!isPlainObject(child) || Object.keys(child).length > 0) {
        setOwn(kept, key, child);
      }
    }
  }
  return kept;
}

/** The messages of the error an invalid schema is reported with, if any. It names no field: the validators list it
 * without a `property` and file it under the `$schema` key of the `ErrorSchema`, where the errors of a property named
 * `$schema` are filed too, so it is what sits there that no listed error of that property says. A `transformErrors`
 * may reword all the listed one says, so it is known by those two alone: without a listed error that names no field,
 * `$schema` is the path of a field like any other
 */
function invalidSchemaMessages<T>({ errors, errorSchema }: ValidationData<T>): string[] {
  if (!errors.some((error) => error.property === undefined)) {
    return [];
  }
  const ofProperty = new Set(
    errors.filter((error) => String(propertyToPath(error.property)) === SCHEMA_KEY).map((error) => error.message),
  );
  return getByPath<string[]>(errorSchema, [SCHEMA_KEY, ERRORS_KEY], []).filter((message) => !ofProperty.has(message));
}

/** `validation` without the errors at the paths `isDropped` names, the list and the `ErrorSchema` by one rule. The
 * error an invalid schema is reported with names no field, so it stays in both; see `invalidSchemaMessages()`
 */
function withoutErrors<T>(
  validation: ValidationData<T>,
  isDropped: (path: FieldPathList) => boolean,
): ValidationData<T> {
  const invalidSchema = invalidSchemaMessages(validation);
  const hasInvalidSchema = invalidSchema.length > 0;
  const errorSchema = pruneErrorSchema(validation.errorSchema, isDropped);
  return {
    errors: validation.errors.filter(
      (error) => (hasInvalidSchema && error.property === undefined) || !isDropped(propertyToPath(error.property)),
    ),
    errorSchema:
      hasInvalidSchema && isDropped([SCHEMA_KEY])
        ? { ...errorSchema, [SCHEMA_KEY]: { [ERRORS_KEY]: invalidSchema } }
        : errorSchema,
  };
}

/** `getByPath()` reading an empty path as the root itself. The overload is the one trust point that the value at a
 * path has the type its reader names: the type a field renders for the form's data, an `ErrorSchema` node for an
 * `ErrorSchema`.
 */
export function getAt<V>(data: unknown, segments: FieldPathList): V;
export function getAt(data: unknown, segments: FieldPathList): unknown {
  return segments.length === 0 ? data : getByPath(data, segments);
}

/** A copy of `errorSchema` with the node at `path` replaced by `node`. A `node` that holds nothing is gone, with the
 * ancestors that leaves empty, which a raise at one of them would read as errors still being there
 */
function replaceErrorSchemaNode<T>(
  errorSchema: ErrorSchema<T>,
  path: FieldPathList,
  node: ErrorSchema<T>,
): ErrorSchema<T> {
  if (path.length === 0) {
    return node;
  }
  // An `ErrorSchema` nests plain objects even at numeric segments, so never auto-vivify arrays
  const replaced = setByPath(copyAlongPath(errorSchema, path), path, node, true);
  // Every container along `path` is a copy or newly made, so unsetting in place touches nothing the state holds
  for (let depth = path.length; depth > 0; depth--) {
    const ancestor = path.slice(0, depth);
    if (Object.keys(getByPath<object>(replaced, ancestor, {})).length > 0) {
      break;
    }
    unsetByPath(replaced, ancestor);
  }
  return replaced;
}

/** `errorSchema` after the keys of the array or object at `path` moved: the errors under each key sit under its new
 * one and those under a key that is gone are gone. Its own, such as `minItems`, belong to no key and stay
 */
function moveErrorSchemaKeys<T>(errorSchema: ErrorSchema<T>, path: FieldPathList, newKeyOf: KeyMove): ErrorSchema<T> {
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
function moveErrorKeys<T>(validation: ValidationData<T>, path: FieldPathList, newKeyOf: KeyMove): ValidationData<T> {
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

/** What a change says of the field's own errors: its raise, with the removal of a key counting as an empty one, since
 * nothing is left at its path for an error to describe
 */
function raiseOf<T>({ newValue, newErrorSchema }: FieldChange<T>): ErrorSchema<T> | undefined {
  return newErrorSchema ?? (newValue === ADDITIONAL_PROPERTY_KEY_REMOVE ? {} : undefined);
}

/** The fields' own errors of `current` after `change`, by the rules of `applyChangeToErrors()`: the part of what a
 * change does to the errors that needs no validator result, which is all that live validation keeps of it
 *
 * @param current - The state the change applies to
 * @param change - The change
 * @returns - The fields' own errors after the change, `current`'s own when the change left them as they were
 */
function ownErrorsAfterChange<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  change: FieldChange<T>,
): ErrorSchema<T> | undefined {
  const { fieldPath, newKeyOf, newOwnKeyOf, dropsOwnErrors, keepsOwnErrors } = change;
  if (keepsOwnErrors) {
    return current.customErrors;
  }
  const path = fieldPathToList(fieldPath);
  const raised = raiseOf(change);
  let { customErrors } = current;
  const hasOwnErrors = getByPath<string[]>(customErrors, [...path, ERRORS_KEY], []).length > 0;
  if (newKeyOf && customErrors) {
    customErrors = moveErrorSchemaKeys(customErrors, path, newOwnKeyOf ?? newKeyOf);
  }
  if (raised) {
    // A copy without what holds nothing, so the form neither holds an object the field may go on to change, such as
    // the `ErrorSchema` of a builder it keeps, nor walks an empty `__errors` on every later merge
    customErrors = replaceErrorSchemaNode(
      customErrors ?? {},
      path,
      pruneErrorSchema(raised, () => false),
    );
  } else if (customErrors && hasOwnErrors && (!newKeyOf || dropsOwnErrors)) {
    customErrors = pruneErrorSchema(
      customErrors,
      (pathOfError) => pathOfError.length === path.length && isPathPrefix(path, pathOfError),
    );
  }
  // An empty raise leaves none, rather than a `{}` every later merge would walk
  return customErrors && Object.keys(customErrors).length === 0 ? undefined : customErrors;
}

/** The errors of `current` after `change`, before any validation of the changed data. The fields' own errors are kept
 * apart from the validator's, which the next validation and a parent replacing the data both rewrite, so a field's
 * raise outlives either until the field raises again (#5347).
 *
 * A change that moved the keys of an array or object, an item to another index or a property to another name, moves
 * the errors of both with them, drops those under a key that is gone, and leaves the container's own where they are
 * unless it says they go too, as an option switch does. The validator's errors of the fields whose values the change
 * replaced, `changed`, go the way `reconcileErrors()` drops them for replaced data: they describe values that are
 * gone, and the next validation rewrites them anyway. One that raises errors replaces the field's own at its path,
 * an empty raise included, and takes the validator's off that path until the form validates again: the raise is the
 * field's say over its path. One that removes the key at its path counts as an empty raise. Any other change clears
 * the field's own `__errors` there.
 *
 * @param current - The state the change applies to
 * @param change - The change
 * @param extraErrors - The `extraErrors` prop, which the displayed errors carry
 * @param getDataChange - Returns what the change replaced in the data, see `dataChange()`; called only when there are
 * validator errors to clear
 * @param [isHidden] - Whether `liveErrors: 'field'` hides the validator's errors at a path, see `hiddenErrorsOf()`
 * @returns - The error members of the state after the change, `current`'s own when the change left them as they were
 */
function applyChangeToErrors<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  change: FieldChange<T>,
  extraErrors: ErrorSchema<T> | undefined,
  getDataChange: () => DataChange,
  isHidden?: (path: FieldPathList) => boolean,
): ChangedErrorState<T> {
  const { fieldPath, newKeyOf } = change;
  const customErrors = ownErrorsAfterChange(current, change);
  const raised = raiseOf(change);
  // Diffing the data is what a keystroke would otherwise cost every form, so it is skipped when no validator error is
  // there to clear
  const changed = current.schemaValidationErrors.length > 0 ? getDataChange() : UNCHANGED;
  const isDataChanged = changed.isRootReplaced || changed.paths.length > 0;
  if (!newKeyOf && !raised && customErrors === current.customErrors && !isDataChanged) {
    return errorStateOf(current);
  }
  const path = fieldPathToList(fieldPath);
  // The validator's own result is the base `extraErrors` and the fields' own errors are merged onto again, as in
  // `reconcileErrors()`: `errors` and `errorSchema` already carry them, so merging onto those would add each a second
  // time on every change (#5041)
  let validation: ValidationData<T> = {
    errors: current.schemaValidationErrors,
    errorSchema: current.schemaValidationErrorSchema,
  };
  if (newKeyOf) {
    validation = moveErrorKeys(validation, path, newKeyOf);
  }
  validation = withoutErrorsOfChanged(validation, changed);
  if (raised) {
    validation = withoutErrors(validation, (pathOfError) => isPathPrefix(path, pathOfError));
  }
  return {
    ...mergeErrors(validation, extraErrors, customErrors, isHidden),
    schemaValidationErrors: validation.errors,
    schemaValidationErrorSchema: validation.errorSchema,
    customErrors,
  };
}

/** The data a derivation pass settles on, with what it took to get there */
interface DerivedData<T, S extends StrictRJSFSchema, F extends FormContextType> {
  /** The data after defaults and, when asked for, sanitization */
  formData: T | undefined;
  /** The render context for `formData`, carrying the schema resolved for it and the utilities that resolved it.
   * Every value in it is `current`'s own whenever nothing it is built from changed, so committing it always is
   * free; handing it back rather than the parts is what keeps state from holding a `retrievedSchema` resolved by
   * utilities it does not also hold.
   */
  context: RenderContext<T, S, F>;
  /** `context.schemaUtils` is `current`'s own: nothing the schema is resolved with changed, so the resolved schema in
   * `context` was produced for `formData` by the very utilities the committed state validates with, and may stand in
   * for the root when validating; see `runLiveValidation()`
   */
  areSchemaUtilsReused: boolean;
}

/** The schema resolved for `formData`. Resolving walks the whole root schema, so it is skipped outright when the
 * utilities and the data they resolve for are both the ones `current.retrievedSchema` was resolved from. Otherwise the
 * result is shared against the committed schema, so rebuilt utilities handing back a deep-equal schema still compare
 * equal by identity.
 *
 * @param current - The state the pass starts from; `undefined` on construction
 * @param schemaUtils - The utilities to resolve with
 * @param formData - The data to resolve the schema for
 * @returns - The resolved schema, shared with `current.retrievedSchema` where possible
 */
function resolveRetrievedSchema<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  schemaUtils: SchemaUtilsType<T, S, F>,
  formData: T | undefined,
): S {
  if (current?.schemaUtils === schemaUtils && current.formData === formData) {
    return current.retrievedSchema;
  }
  return replaceEqualDeep(current?.retrievedSchema, schemaUtils.retrieveSchema(schemaUtils.getRootSchema(), formData));
}

/** How one data pass differs from the default, which just fills in the missing defaults */
interface DeriveDataOptions {
  /** Sanitize the data against the field tree of the state before this pass, see `sanitizeFieldTree()` */
  isSanitized?: boolean;
  /** The change this pass is for, if any: the value at its path is the user's */
  edit?: FieldEdit;
  /** The path of the change this pass is for, if a field made it, whose field and the fields above it keep the options
   * they show while the defaults are filled, see `heldPathOf()`. A root write a field makes is no `edit` but holds the
   * root's option, and data set from outside holds none here, even where it is sanitized as an `edit`. That sanitize
   * still holds along the `edit`'s path, but its diff shows one option on both sides, so the option it holds there
   * judges nothing differently
   */
  heldPath?: FieldPathList;
  /** This pass originated from `reset()`: it computes defaults the same way an initial render does even though the
   * instance has generated defaults before
   */
  isReset?: boolean;
  /** The option selections to settle under, in place of the state's own, as for the baseline, see `baselineUiState` */
  uiState?: UiStateReader;
  /** The data holding the clears this pass keeps, laid out as the data it settles, see `keepClears()`. They are kept
   * by every fill, so the schema each round resolves describes the data with its clears
   */
  clears?: unknown;
}

/** Settles the data for `props` and `inputFormData`: any missing required defaults are filled in, then, when asked,
 * the result is sanitized for the field tree it builds against the tree before the change, and filled again, until the
 * two stop moving. Each round diffs against the tree of the data the round before sanitized, so a value the loop
 * wrote is judged against the schema it was written for. Every caller that needs derived data goes through here, so
 * the resolved schema and the data it describes are always produced together.
 *
 * @param current - The state the pass starts from; `undefined` on construction
 * @param inputFormData - The data to settle; `undefined` computes defaults from nothing
 * @param options - How this pass differs from the default
 * @param props - The current props
 * @returns - The settled data and the render context carrying the schema that was resolved for it
 */
function deriveFormData<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  inputFormData: T | undefined,
  options: DeriveDataOptions,
  props: FormProps<T, S, F>,
): DerivedData<T, S, F> {
  const schemaUtils = resolveSchemaUtils(props, current);
  const { formData, retrievedSchema } = settleFormData(current, inputFormData, options, props, schemaUtils);
  // Always derived, never skipped on the grounds that the schema utilities were reused: the registry is built from
  // `idPrefix`, `widgets`, `templates`, `fields`, `formContext` and `uiSchema` too, none of which the utilities are
  // resolved from. `deriveRenderContext()` shares its result against `current`, so an unchanged context keeps every
  // reference the fields hold.
  const context = deriveRenderContext(props, retrievedSchema, current, schemaUtils);
  return { formData, context, areSchemaUtilsReused: schemaUtils === current?.schemaUtils };
}

/** The data half of `deriveFormData()`, with the schema utilities it settles the data with already resolved
 *
 * @returns - The settled data and the schema resolved for it
 */
function settleFormData<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  inputFormData: T | undefined,
  options: DeriveDataOptions,
  props: FormProps<T, S, F>,
  schemaUtils: SchemaUtilsType<T, S, F>,
): { formData: T | undefined; retrievedSchema: S } {
  const { isSanitized = false, edit, heldPath, isReset = false } = options;
  const uiState = options.uiState ?? current?.uiState;
  const { uiSchema = {} } = props;
  const rootSchema = schemaUtils.getRootSchema();
  // The data is shared against the committed data when there is some, so an unchanged subtree keeps the reference the
  // fields hold; on construction, against the caller's own value
  const shareBase = current ? current.formData : inputFormData;
  // A reset re-runs the same "initial" defaults pass a first render does, so `ui:initialValue` applies again even
  // though this instance has generated defaults before.
  const initialDefaultsGenerated = (current?.initialDefaultsGenerated ?? false) && !isReset;
  // The defaults of a field offering options are those of the option it shows, which is the form's to keep
  const fieldState = uiState && fieldStateOf(uiState, schemaUtils, heldPath);
  const fill = (data: T | undefined, clears: unknown) => {
    const filled = replaceEqualDeep(
      shareBase,
      asFilledFormData<T>(
        schemaUtils.getDefaultFormState(
          rootSchema,
          data,
          false,
          initialDefaultsGenerated,
          uiSchema,
          undefined,
          fieldState,
        ),
      ),
    );
    return clears === undefined ? filled : keepClears(filled, data, clears);
  };
  let formData = fill(inputFormData, options.clears);
  // The sanitize below writes no clear of its own, so every clear a later round's data holds is one the pass kept
  const refill = (data: T | undefined) => fill(data, options.clears === undefined ? undefined : data);
  const treeOf = (data: T | undefined): FieldTree<T, S, F> => ({
    schemaUtils,
    formData: data,
    retrievedSchema: resolveRetrievedSchema(current, schemaUtils, data),
  });
  let tree = treeOf(formData);
  if (isSanitized && current && uiState) {
    const seen: string[] = [];
    let previous: FieldTree<T, S, F> = current;
    let roundEdit = edit;
    for (;;) {
      const sanitized = replaceEqualDeep(formData, sanitizeFieldTree(previous, tree, uiState, roundEdit));
      // Wrapped in an object to deal with a scalar or `undefined` value. Data a round has already produced would only
      // produce it again, which ends a loop of conditions that flip each other. It ends filled, as every other pass
      // does, so a default the round dropped is there again
      if (sanitized === formData) {
        break;
      }
      const hash = hashObject({ formData: sanitized });
      if (seen.includes(hash)) {
        formData = refill(sanitized);
        break;
      }
      seen.push(hash);
      previous = tree;
      // Only the first round diffs against the data before the move: every later one diffs against data already moved
      roundEdit = edit && { path: edit.path };
      formData = refill(sanitized);
      tree = treeOf(formData);
    }
  }
  const { retrievedSchema } = tree.formData === formData ? tree : treeOf(formData);
  return { formData, retrievedSchema };
}

/** What reconciling the errors of a derivation needs to know */
interface ErrorOptions<S> {
  /** The schema changed, so the existing errors describe another schema and are dropped */
  isSchemaChanged?: boolean;
  /** Live validation runs for this pass; otherwise the committed validation results are carried forward */
  mustValidate: boolean;
  /** The schema to validate with in place of the root, when it still describes the data; see `runLiveValidation()` */
  validationSchema?: S;
  /** Returns what changed in the `formData`; called only when live validation does not run, which is when it is needed
   * to clear the changed fields' errors
   */
  getDataChange?: () => DataChange;
  /** The fields revealed once the pass's data settled, which decide the errors `liveErrors: 'field'` hides; the
   * committed ones when the pass leaves them as they are
   */
  revealed?: RevealedPaths;
}

/** What differs between two values of the form's data */
interface DataChange {
  /** The difference cannot be narrowed below the root: a primitive, an array of another length, or a change of type */
  isRootReplaced: boolean;
  /** The path of each field that differs, split the way `toErrorSchema()` splits an error's property, so the two
   * address the same entry. A key that splits to no segment at all, such as `''`, has its errors filed at the root, so
   * its path is the empty one
   */
  paths: FieldPathList[];
}

const UNCHANGED: DataChange = { isRootReplaced: false, paths: [] };

function dataChange(formData: unknown, previous: unknown): DataChange {
  if (Object.is(formData, previous)) {
    return UNCHANGED;
  }
  // The wrapper below would name the same paths for an object root, after a deep comparison of the whole root that
  // comparing its fields one by one makes a second time, so an object root is spared that
  if (isPlainObject(formData) && isPlainObject(previous)) {
    return { isRootReplaced: false, paths: getChangedFields(formData, previous, true).map((field) => toPath(field)) };
  }
  // Any other root is compared as the one property of a wrapper, so a root array is narrowed to its items the way an
  // array under a property is, and a difference that can't be narrowed comes back as the wrapper's own key:
  // `getChangedFields()` names the fields of an object, so it has no name for a replaced root
  const root = 'root';
  const fields = getChangedFields({ [root]: formData }, { [root]: previous }, true);
  return {
    isRootReplaced: fields.includes(root),
    paths: fields.map((field) => toPath(field).slice(1)),
  };
}

/** `validation` without the errors of the fields `changed` names: a changed field's errors go, with those of
 * everything below it. Every container holding the field changed along with it, the root included, so an error of
 * their own, such as the `uniqueItems` of the array the field sits in, goes too. Only their own: the other fields they
 * hold did not change and keep theirs. A replaced root takes every error the validator reported on a field with it.
 */
function withoutErrorsOfChanged<T>(validation: ValidationData<T>, changed: DataChange): ValidationData<T> {
  const { isRootReplaced, paths } = changed;
  if (isRootReplaced) {
    return withoutErrors(validation, () => true);
  }
  if (paths.length === 0) {
    return validation;
  }
  return withoutErrors(validation, (pathOfError) =>
    paths.some(
      (pathOfField) =>
        isPathPrefix(pathOfError, pathOfField) || (pathOfField.length > 0 && isPathPrefix(pathOfField, pathOfError)),
    ),
  );
}

/** `data` with what the array or object at `path` holds where `newKeyOf` put it: diffed against `changed`, a moved
 * value is no change, so the errors that moved with a key are kept and those of a value that is gone are not. An array
 * also holds the items `changed` added, so an add or a copy is no change either: no error sits under an index that
 * held nothing, and the array's own errors stay for the next validation as they do through a remove or a reorder,
 * whether or not the new item has a value. A property an object gained is a change, since the validator may have
 * reported it missing.
 */
function withKeysMoved(data: unknown, changed: unknown, path: FieldPathList, newKeyOf: KeyMove): unknown {
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

/** Reconciles the errors for a derivation, either by validating `formData` or by carrying the committed validation
 * results forward, dropping the ones of fields that changed, and merging `extraErrors` and the custom errors onto them.
 *
 * @param current - The state the pass starts from; `undefined` on construction
 * @param props - The current props
 * @param context - The render context derived for `formData`
 * @param formData - The data the errors are for
 * @param options - How this pass reconciles its errors
 * @returns - The errors to display and the validator's own results they were built from
 */
function reconcileErrors<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  props: FormProps<T, S, F>,
  context: RenderContext<T, S, F>,
  formData: T | undefined,
  options: ErrorOptions<S>,
): ErrorState<T> {
  const { isSchemaChanged = false, mustValidate, validationSchema, getDataChange = () => UNCHANGED } = options;
  const revealed = options.revealed ?? current?.revealed ?? NOTHING_REVEALED;
  const isHidden = hiddenErrorsOf(props, { revealed });
  if (mustValidate) {
    return runLiveValidation(props, context, formData, current?.customErrors, validationSchema, undefined, isHidden);
  }
  // oxlint-disable-next-line typescript/no-deprecated
  const isErrorStateDropped = props.noValidate || isSchemaChanged;
  // If the `props.noValidate` option is set or the schema has changed, we reset the error state. Otherwise the base has
  // to be the validator's own result, since `extraErrors` and `customErrors` are merged in below and `state.errors`
  // already carries them, which would merge each in a second time
  const validation: ValidationData<T> = isErrorStateDropped
    ? { errors: [], errorSchema: {} }
    : withoutErrorsOfChanged(
        { errors: current?.schemaValidationErrors ?? [], errorSchema: current?.schemaValidationErrorSchema ?? {} },
        getDataChange(),
      );
  return {
    ...mergeErrors(validation, props.extraErrors, current?.customErrors, isHidden),
    schemaValidationErrors: validation.errors,
    schemaValidationErrorSchema: validation.errorSchema,
  };
}

/** Whether a pass validates its data: only under `liveValidate: 'onChange'`, only for data that is there, and only when
 * something the errors depend on changed, so a parent re-render that touches neither the data nor the validation
 * shows no error the user has not earned yet. `'onBlur'` owns its validation pass in `applyBlur()`.
 */
function mustLiveValidate<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  isDataPassed: boolean,
  isInputChanged: boolean,
): boolean {
  return isDataPassed && isLiveValidated(props) && isInputChanged;
}

/** Whether the form validates its data on every change */
export function isLiveValidated<T, S extends StrictRJSFSchema, F extends FormContextType>(props: FormProps<T, S, F>) {
  // oxlint-disable-next-line typescript/no-deprecated
  return !props.noValidate && props.liveValidate === 'onChange';
}

/** Whether the form validates its data when a field is blurred */
export function isBlurValidated<T, S extends StrictRJSFSchema, F extends FormContextType>(props: FormProps<T, S, F>) {
  // oxlint-disable-next-line typescript/no-deprecated
  return !props.noValidate && props.liveValidate === 'onBlur';
}

/** What changed between the committed state and a context derived from the current props, read off the references
 * the derivation shared: a member is a new object exactly when an input it is built from changed
 */
function detectContextChanges<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  context: RenderContext<T, S, F>,
) {
  if (!current) {
    return { isSchemaChanged: false, isValidationPropChanged: false };
  }
  return {
    isSchemaChanged: context.schema !== current.schema,
    // The utilities carry the schema, the validator and the merge settings; the callbacks are the rest
    isValidationPropChanged:
      context.schemaUtils !== current.schemaUtils || context.validationProps !== current.validationProps,
  };
}

/** The state derived from data: on construction from the seed the props hand the form, and from the data the form
 * holds whenever the schema, a `ui:emptyValue`, `defaultFormStateBehavior` or `additionalPropertiesWhenAbsent`
 * changed, since those are the props whose change transforms the data (a default it did not have before, a branch that
 * no longer applies). No other prop change runs this: an unrelated re-render must not rerun value initialization, so
 * `deriveState()` re-derives the render context alone for those.
 *
 * @param current - The state the pass starts from; `undefined` on construction
 * @param inputFormData - The data to derive from
 * @param props - The current props
 * @returns - The new state, sharing every unchanged subtree with `current`
 */
function deriveDataState<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  inputFormData: T | undefined,
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  // A schema change sanitizes the data for the new schema's tree, as an edit does for the tree it leads to, and leaves
  // the data of a disabled or read-only form as it is, as an edit there does
  const options = { isSanitized: !props.disabled && !props.readonly };
  const { formData, context, areSchemaUtilsReused } = deriveFormData(current, inputFormData, options, props);
  const { isSchemaChanged, isValidationPropChanged } = detectContextChanges(current, context);
  const baseline = current ? rederiveBaseline(current, formData, options, props, context.schemaUtils) : formData;
  // Construction validates nothing: the errors of a seed the user has not touched are not shown until they are earned
  const isDataChanged = current !== undefined && formData !== current.formData;
  const isDataPassed = current ? current.isDataPassed : inputFormData !== undefined;
  const marks = current
    ? marksFollowingData(current, formData)
    : { touchedPaths: NO_PATHS, revealed: NOTHING_REVEALED };
  const errors = reconcileErrors(current, props, context, formData, {
    isSchemaChanged,
    revealed: marks.revealed,
    mustValidate: mustLiveValidate(props, isDataPassed, isDataChanged || isValidationPropChanged),
    validationSchema: areSchemaUtilsReused ? context.retrievedSchema : undefined,
    // Without a validation pass, the errors of the fields the data changed at describe values that are gone. The
    // data is shared against the committed data, so unchanged subtrees are skipped by identity
    getDataChange: current && (() => dataChange(formData, current.formData)),
  });
  return {
    ...current,
    ...context,
    formData,
    baseline,
    baselineUiState: current?.baselineUiState ?? withoutSelections(context.uiState),
    ...marks,
    isDataPassed,
    ...errors,
    initialDefaultsGenerated: true,
  };
}

/** The baseline after a prop change re-derived the data into `formData`: the baseline put through the same derivation,
 * since the change is not the user's, under the options the baseline was derived with, see `baselineUiState`, except
 * at a field whose selection holds for the baseline's data there, see `withSelectionsHeldFor()`. A form whose data is
 * its baseline takes the derived data itself
 *
 * @param current - The state before the prop change
 * @param formData - The data the prop change re-derived
 * @param options - The options the data was re-derived with
 * @param props - The current props
 * @param schemaUtils - The schema utilities the data was re-derived with
 * @returns - The baseline for `formData`
 */
function rederiveBaseline<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  formData: T | undefined,
  options: DeriveDataOptions,
  props: FormProps<T, S, F>,
  schemaUtils: SchemaUtilsType<T, S, F>,
): T | undefined {
  const { baseline } = current;
  if (Object.is(baseline, current.formData)) {
    return formData;
  }
  const fromBaseline: FormState<T, S, F> = {
    ...current,
    formData: baseline,
    // Read only by the sanitize, as the tree the data is diffed against
    retrievedSchema: options.isSanitized
      ? resolveRetrievedSchema(current, current.schemaUtils, baseline)
      : current.retrievedSchema,
  };
  return settleFormData(
    fromBaseline,
    baseline,
    {
      ...options,
      uiState: withSelectionsHeldFor(current.uiState, current.baselineUiState, (at) => getAt(baseline, at)),
    },
    props,
    schemaUtils,
  ).formData;
}

/** Freezes plain objects and arrays in `data`, and nothing else: a `File`, a `Date` or a class instance is left
 * alone. Development only, and only ever applied to form data and the `dirtyFields` and `touchedFields` built from it:
 * the form data a consumer receives shares subtrees with the value the change was applied to, the `formData` the
 * consumer passed included, so a mutation of it corrupts the consumer's state silently. Frozen, it throws where the
 * mutation happens instead.
 *
 * @param data - The form data to freeze
 */
export function freezeFormData(data: unknown) {
  if ((!Array.isArray(data) && !isPlainObject(data)) || Object.isFrozen(data)) {
    return;
  }
  Object.freeze(data);
  for (const value of Object.values(data)) {
    freezeFormData(value);
  }
}

/** Returns `data` with every container along `path` shallow-copied, leaving the copies ready for a write at that
 * path that must not touch the original. Subtrees off the path keep the reference the fields already hold, so
 * nothing has to walk the data afterwards to restore the sharing a deep clone would have destroyed. Stops where
 * the path runs off the end of what is actually there, since `setByPath()` creates the rest itself; the copies made
 * up to that point are what keeps it from creating them inside a container the committed state still holds.
 *
 * @param data - The data to copy along `path`
 * @param path - The path whose containers are copied
 * @returns - The copied data, or `data` itself when it holds no containers to copy
 */
export function copyAlongPath<T>(data: T, path: FieldPathList): T {
  if (!isObject(data) && !Array.isArray(data)) {
    return data;
  }
  const copyOf = (container: object) => (Array.isArray(container) ? [...container] : { ...container });
  const root = copyOf(data as object) as Record<PropertyKey, unknown>;
  let container = root;
  for (const segment of path.slice(0, -1)) {
    // Own keys only, as `setByPath()` reads them: a `__proto__` the data does not hold as its own key reads the
    // prototype, and writing a copy of that back would re-point the root copy's prototype instead of adding a key
    const child = Object.hasOwn(container, segment) ? container[segment] : undefined;
    if (!isObject(child) && !Array.isArray(child)) {
      break;
    }
    const copy = copyOf(child as object) as Record<PropertyKey, unknown>;
    container[segment] = copy;
    container = copy;
  }
  return root as T;
}

/** The path whose field and the fields above it keep the options they show for the data `change` leaves, see
 * `fieldStateOf()`: the edit's, for a change a field made, the root's included. Data set from outside, as
 * `setFieldValue()` sets it at any path, holds none, so it is matched again, as the render matches it
 */
function heldPathOf<T>(change: FieldChange<T>): FieldPathList | undefined {
  return change.isFieldEdit ? (change.editedPath ?? fieldPathToList(change.fieldPath)) : undefined;
}

/** Whether `container` holds `key` as its own, without a value */
function holdsUndefined(container: GenericObjectType, key: string): boolean {
  return Object.hasOwn(container, key) && container[key] === undefined;
}

/** `derived` with each clear that both `written` and `cleared` hold kept: a field cleared, in this change or an earlier
 * one, stays cleared whatever defaults the derivation merged in (#5125), such as under
 * `mergeDefaultsIntoFormData: 'useDefaultIfFormDataUndefined'`. A cleared property is an own key holding `undefined`,
 * and a cleared array item is `null`, as a cleared item is written. Only the containers whose references differ are
 * walked, and an array index by index, as `written` holds it in the order the change left it
 *
 * @param derived - The data the derivation filled
 * @param written - The data the derivation filled it from
 * @param cleared - The data whose clears are kept, laid out as `written` is
 * @returns - `derived`, sharing every subtree the walk cleared nothing in
 */
function keepClears<V>(derived: V, written: unknown, cleared: unknown): V;
function keepClears(derived: unknown, written: unknown, cleared: unknown): unknown {
  if (derived === written) {
    return derived;
  }
  if (Array.isArray(derived) && Array.isArray(written)) {
    const items: readonly unknown[] = derived;
    const writtenItems: readonly unknown[] = written;
    const clearedItems: readonly unknown[] = Array.isArray(cleared) ? cleared : [];
    let kept: unknown[] | undefined;
    items.forEach((item, index) => {
      const wasCleared = writtenItems[index] === null && clearedItems[index] === null;
      const next = wasCleared ? null : keepClears(item, writtenItems[index], clearedItems[index]);
      if (next !== item) {
        kept ??= [...items];
        kept[index] = next;
      }
    });
    return kept ?? items;
  }
  if (isPlainObject(derived) && isPlainObject(written)) {
    const clearedKeys = isPlainObject(cleared) ? cleared : {};
    let kept: GenericObjectType | undefined;
    for (const [key, value] of Object.entries(derived)) {
      const wasCleared = holdsUndefined(written, key) && holdsUndefined(clearedKeys, key);
      const next = wasCleared ? undefined : keepClears(value, written[key], clearedKeys[key]);
      if (next !== value) {
        kept ??= { ...derived };
        setOwn(kept, key, next);
      }
    }
    return kept ?? derived;
  }
  return derived;
}

/** The data whose clears `change` keeps, laid out as `written`, the data it wrote; see `keepClears()`. A field's own
 * edit keeps the committed data's clears and its own: a container it writes, as an option switch writes one, keeps
 * only the clears the committed data held there, under the keys the edit moved them to, since the `undefined` a switch
 * leaves is for the defaults to fill. Data written from outside, as `setFieldValue()` writes
 * it, is left to its defaults, and the clears elsewhere stay. A `transformChange` rewrite keeps those its edit kept
 *
 * @param change - The change
 * @param committed - The data before the change
 * @param written - The data the change wrote, before any defaults
 * @param path - The path of the change
 * @returns - The data holding the clears to keep, or `undefined` for none
 */
function clearsOf<T>(change: FieldChange<T>, committed: T | undefined, written: T, path: FieldPathList): unknown {
  if (change.editedPath) {
    return change.editedData;
  }
  if (!change.isFieldEdit) {
    if (path.length === 0) {
      return undefined;
    }
    const elsewhere = copyAlongPath(written, path);
    unsetByPath(elsewhere, path);
    return elsewhere;
  }
  const { newValue, newKeyOf } = change;
  if (!isObject(newValue) && !Array.isArray(newValue)) {
    return written;
  }
  const committedAtPath = getAt<unknown>(committed, path);
  const before = newKeyOf ? movedKeys(committedAtPath, newKeyOf) : committedAtPath;
  return path.length === 0 ? before : setByPath(copyAlongPath(written, path), path, before);
}

/** What the array or object `container` holds, each value under the key `newKeyOf` moved it to, and without the values
 * it moved nowhere
 */
function movedKeys(container: unknown, newKeyOf: KeyMove): unknown {
  if (Array.isArray(container)) {
    const items: readonly unknown[] = container;
    const moved: unknown[] = [];
    items.forEach((item, index) => {
      const newKey = newKeyOf(String(index));
      if (newKey !== undefined) {
        moved[Number(newKey)] = item;
      }
    });
    return moved;
  }
  if (!isPlainObject(container)) {
    return container;
  }
  const moved: GenericObjectType = {};
  for (const [key, value] of Object.entries(container)) {
    const newKey = newKeyOf(key);
    if (newKey !== undefined) {
      setOwn(moved, newKey, value);
    }
  }
  return moved;
}

/** Applies the data of one `change` to `current`, returning the next state with `current`'s errors. The `newValue` is
 * set at the change's path in the data, which is then run through `deriveFormData()` for any missing defaults and,
 * when the resolved schema changed, sanitization. If `omitExtraData` and `liveOmit` are turned on, the data is filtered
 * to remove any extra data not in a form field. The errors are `applyChangeToErrorsOf()`'s, kept apart so an edit's
 * data can be decided on before anything validates it. Reads nothing but its arguments and performs no callbacks:
 * committing the result and notifying are the caller's.
 *
 * @param current - The state the change applies to
 * @param change - The change to apply
 * @param props - The current props
 * @returns - The next state, sharing every unchanged subtree with `current`
 */
export function applyChangeToData<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  change: FieldChange<T>,
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  const { newValue, fieldPath } = change;
  // The single place where a `FieldPath` is parsed back into segments for writing into the formData
  const path = fieldPathToList(fieldPath);
  const { omitExtraData, liveOmit, disabled, readonly } = props;
  const { formData: oldFormData } = current;
  // The derivation below hands back the context for the data it settled on, resolved schema included, so committing
  // whatever it returns is what keeps state's resolved schema and the utilities that resolved it in step.
  let context: RenderContext<T, S, F> = current;
  const isRootPath = path.length === 0;
  let formData: T | undefined;
  if (isRootPath) {
    formData = newValue;
  } else if (isObject(oldFormData) || Array.isArray(oldFormData)) {
    // The write below lands on copies of the containers along the path; everything off it keeps the reference the
    // fields hold, and nothing has to be walked afterwards to restore that sharing
    formData = copyAlongPath(oldFormData, path);
  } else {
    // A field edit under an empty root, a `null` seed or a cleared scalar, creates the container the field lives in
    // instead of being dropped
    formData = (typeof path[0] === 'number' ? [] : {}) as T;
  }

  if (isObject(formData) || Array.isArray(formData)) {
    if (newValue === ADDITIONAL_PROPERTY_KEY_REMOVE) {
      // For additional properties, this key was explicitly removed, so unset it
      unsetByPath(formData, path);
    } else if (!isRootPath) {
      // A cleared array item is written as `null`, as ArrayField's `handleChange` writes it, since AJV needs `null`
      const isArrayItem = typeof path[path.length - 1] === 'number';
      setByPath(formData, path, newValue === undefined && isArrayItem ? null : newValue);
    }
    const written = formData;
    // Only the data and its context are derived here; the errors are reconciled below. A root write is sanitized only
    // where it stands for an edit, as the data a `transformChange` writes over one does. The `undefined` a clear leaves
    // is stripped from the copy the validator gets, so AJV never sees `{ [key]: undefined }` for a `string` field
    // (#4518)
    const editedPath = change.editedPath ?? (isRootPath ? undefined : path);
    const derived = deriveFormData(
      current,
      formData,
      {
        isSanitized: editedPath !== undefined && !disabled && !readonly,
        edit: editedPath && { path: editedPath, newKeyOf: change.editedPath ? undefined : change.newKeyOf },
        heldPath: heldPathOf(change),
        clears: clearsOf(change, oldFormData, written, path),
      },
      props,
    );
    formData = derived.formData;
    context = derived.context;
  }

  let omitted: DataAndBaseline<T> = { formData, baseline: current.baseline };
  if (omitExtraData === true && liveOmit === 'onChange') {
    omitted = committedOmission(omitExtraDataOf({ ...current, ...context, formData }, heldPathOf(change)));
  }

  return {
    ...current,
    ...context,
    ...omitted,
    ...marksAfterChange(current, change, omitted.formData, props),
    // An edit is data the user made, whose errors they have earned, so a prop change live-validates it from now on
    isDataPassed: true,
  };
}

/** The errors after one `change`, for `changed`, the state `applyChangeToData()` made of it, which still carries the
 * errors from before the change. With `isValidated`, the data is validated and only the fields' own errors are
 * carried through; otherwise they are changed as `applyChangeToErrors()` describes.
 *
 * @param changed - The state the change's data left, with the errors from before it
 * @param previousFormData - The data before the change
 * @param change - The change
 * @param props - The current props
 * @param isValidated - Whether the change's data is validated
 * @returns - `changed` with the errors after the change
 */
export function applyChangeToErrorsOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  changed: FormState<T, S, F>,
  previousFormData: T | undefined,
  change: FieldChange<T>,
  props: FormProps<T, S, F>,
  isValidated: boolean,
): FormState<T, S, F> {
  const { formData } = changed;
  const isHidden = hiddenErrorsOf(props, changed);
  if (isValidated) {
    // The validation replaces the validator's result whole, so only the fields' own errors are carried through
    const customErrors = ownErrorsAfterChange(changed, change);
    return {
      ...changed,
      ...runLiveValidation(
        props,
        changed,
        formData,
        customErrors,
        changed.retrievedSchema,
        heldPathOf(change),
        isHidden,
      ),
      customErrors,
    };
  }
  // No validation rewrites the validator's errors here, so those of the replaced values are cleared instead. What a
  // key move leaves is diffed with the keys where the move put them, so the errors that moved with them stay
  const { newKeyOf } = change;
  const getDataChange = () =>
    dataChange(
      formData,
      newKeyOf
        ? withKeysMoved(previousFormData, formData, fieldPathToList(change.fieldPath), newKeyOf)
        : previousFormData,
    );
  return { ...changed, ...applyChangeToErrors(changed, change, props.extraErrors, getDataChange, isHidden) };
}

/** The error members of a state with `extraErrors` as the only errors on display, as a reset or a valid submission
 * leaves it
 */
function extraErrorsAlone<T>(extraErrors: ErrorSchema<T> | undefined): ErrorState<T> {
  // Merged into nothing rather than listed as they are, so an array `extraErrors` holds for the items of an array
  // field is keyed by index, as every `ErrorSchema` the form hands out is
  const { errors, errorSchema } = mergeErrors<T>({ errors: [], errorSchema: {} }, extraErrors);
  return { errors, errorSchema, schemaValidationErrors: [], schemaValidationErrorSchema: {} };
}

/** The state after `reset()`: the data is re-derived from the seed the way an initial render does it and becomes the
 * baseline, every error the form holds, including the custom ones fields raised, is cleared, which leaves
 * `extraErrors` as the only errors on display, the touched fields and the revealed ones start again, and the render
 * context the derivation resolved with is committed alongside the data.
 *
 * @param current - The state being reset
 * @param props - The current props
 * @param seed - The seed: the data `reset()` was last passed, or else the props' own, see `seedOf()`
 * @returns - The reset state, sharing every unchanged subtree with `current`
 */
export function applyReset<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
  seed: T | undefined,
): FormState<T, S, F> {
  const { formData, context } = deriveFormData(current, seed, { isReset: true }, props);
  return {
    ...current,
    ...context,
    formData,
    baseline: formData,
    baselineUiState: withSelectionsAsOf(context.uiState, (at) => getAt(formData, at)),
    touchedPaths: NO_PATHS,
    revealed: NOTHING_REVEALED,
    isDataPassed: seed !== undefined,
    ...extraErrorsAlone(props.extraErrors),
    // The reset pass has generated the initial defaults, so the next unrelated recompute is not an initial pass and
    // will not resurrect a `ui:initialValue` the user has since cleared
    initialDefaultsGenerated: true,
    customErrors: undefined,
  };
}

/** `current` with the blur `blurred` touching what it touches, see `BlurTouch`, and revealing it when `liveErrors` is
 * `'field'` and `liveValidate` is `'onBlur'`: a field's errors, or for a blur that touches nothing, the container's
 * own errors. A field a change dropped since the blur reached the form, such as one the `Form`'s `onBlur` writes over,
 * is neither touched nor revealed, as a change drops the marks of the keys it drops, see `withoutDroppedPaths()`
 */
function markBlur<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
  { fieldPath, touches, dataAtBlur }: BlurAtData<T>,
): FormState<T, S, F> {
  const { touchedPaths, revealed } = current;
  const isRevealed = props.liveErrors === 'field' && isBlurValidated(props);
  if (isPathDropped(fieldPath, dataAtBlur, current.formData)) {
    return current;
  }
  if (touches === 'nothing') {
    return isRevealed
      ? { ...current, revealed: { ...revealed, containers: withPaths(revealed.containers, fieldPath) } }
      : current;
  }
  const touched =
    touches === 'leaves' ? leafPathsOf(getAt(current.formData, fieldPathToList(fieldPath)), fieldPath) : [fieldPath];
  return {
    ...current,
    touchedPaths: withPaths(touchedPaths, ...touched),
    revealed: isRevealed ? { ...revealed, fields: withPaths(revealed.fields, fieldPath) } : revealed,
  };
}

/** The state after a field is blurred: the field touched, and revealed when `liveErrors` is `'field'` and
 * `liveValidate` is `'onBlur'`, see `markBlur()`, the data with extra data omitted when `liveOmit` is `'onBlur'`,
 * validated when `liveValidate` is.
 *
 * @param current - The state at the blur
 * @param props - The current props
 * @param [blurred] - The field blurred, what its blur touches and the form's data when the blur reached it, when a
 *        `SchemaField` reported it
 * @returns - The next state, sharing every unchanged subtree with `current`
 */
export function applyBlur<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
  blurred?: BlurAtData<T>,
): FormState<T, S, F> {
  const { omitExtraData, liveOmit } = props;
  const { customErrors, retrievedSchema } = current;
  const marked = blurred ? markBlur(current, props, blurred) : current;
  const omitted =
    omitExtraData === true && liveOmit === 'onBlur' ? withOmission(marked, omitExtraDataOf(current)) : marked;
  const validation = isBlurValidated(props)
    ? runLiveValidation(
        props,
        current,
        omitted.formData,
        customErrors,
        retrievedSchema,
        undefined,
        hiddenErrorsOf(props, omitted),
      )
    : undefined;
  return { ...omitted, ...validation };
}

/** Validates `formData` for a submission or `validateForm()`: whether the errors block, the merged errors to report,
 * and the state that displays them.
 *
 * @param current - The state being validated
 * @param props - The current props
 * @param formData - The data to validate
 * @returns - The blocking flag and the next state, which carries the errors to report
 */
export function applyValidation<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
  formData: T | undefined,
): { hasError: boolean; next: FormState<T, S, F> } {
  const { extraErrors, extraErrorsAreWarnings } = props;
  const { errors: prevErrors, customErrors } = current;
  const schemaValidation = validateFormData(props, current, formData);
  // Always merge extraErrors/customErrors so they remain visible in state regardless of extraErrorsAreWarnings. A
  // validation the form was asked for shows every error, so `liveErrors: 'field'` reveals them all from now on
  const { errors, errorSchema } = mergeErrors(schemaValidation, extraErrors, customErrors);
  const start = withEveryErrorRevealed(current);
  // extraErrors also block unless extraErrorsAreWarnings is set, in which case they are informational only.
  const hasBlockingExtraErrors = !extraErrorsAreWarnings && !!extraErrors && toErrorList(extraErrors).length > 0;
  // customErrors are raised imperatively by field/widget components (via onChange's errorSchema argument) and,
  // like schema errors, always block regardless of extraErrorsAreWarnings.
  const hasCustomErrors = !!customErrors && toErrorList(customErrors).length > 0;
  const hasError = schemaValidation.errors.length > 0 || hasBlockingExtraErrors || hasCustomErrors;
  let next = start;
  if (hasError) {
    next = {
      ...start,
      errors,
      errorSchema,
      schemaValidationErrors: schemaValidation.errors,
      schemaValidationErrorSchema: schemaValidation.errorSchema,
    };
  } else if (errors.length > 0 || prevErrors.length > 0) {
    // Either non-blocking `extraErrors` are on display without `onError` firing, or the errors that were on display
    // are gone; the validator's own results are empty for both
    next = { ...start, errors, errorSchema, schemaValidationErrors: [], schemaValidationErrorSchema: {} };
  }
  return { hasError, next };
}

/** The data after extra data is omitted, and how to get the baseline after it, see `omitExtraDataOf()` */
export interface ExtraDataOmission<T> {
  formData: T | undefined;
  omitBaseline: () => T | undefined;
}

/** The data once extra data, the fields the schema does not describe, is dropped from `formData`, and the baseline
 * that goes with it. A change to the data the user did not make goes to the baseline in the same step, so the baseline
 * is omitted too, but only when the data lost something: omitted up front, it would make the form dirty while the data
 * still holds the extra keys. The baseline is omitted under the options it was derived with, not the ones the user
 * picked since, see `baselineUiState`, and only once a caller commits it
 *
 * @param current - The state whose data the omit drops extra data from
 * @param [heldPath] - The path whose field and the fields above it keep the options they show, see `heldPathOf()`
 * @returns - The data after the omit, and how to get the baseline after it
 */
export function omitExtraDataOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  heldPath?: FieldPathList,
): ExtraDataOmission<T> {
  const { schema, schemaUtils, uiState, baselineUiState, formData, baseline } = current;
  const omitted = replaceEqualDeep(
    formData,
    schemaUtils.omitExtraData(schema, formData, fieldStateOf(uiState, schemaUtils, heldPath)),
  );
  if (Object.is(omitted, formData)) {
    return { formData, omitBaseline: () => baseline };
  }
  return {
    formData: omitted,
    omitBaseline: () =>
      Object.is(baseline, formData)
        ? omitted
        : replaceEqualDeep(
            baseline,
            schemaUtils.omitExtraData(schema, baseline, fieldStateOf(baselineUiState, schemaUtils)),
          ),
  };
}

/** `current` with every error revealed to `liveErrors: 'field'`, as a submit attempt or `validateForm()` leaves it,
 * whatever `liveErrors` is now, so a later switch to `'field'` still shows them
 */
function withEveryErrorRevealed<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
): FormState<T, S, F> {
  return current.revealed.all ? current : { ...current, revealed: { ...current.revealed, all: true } };
}

/** The state after a valid submission: the submitted data, with `extraErrors` as the only errors on display
 *
 * @param current - The state at the submission
 * @param props - The current props
 * @param [omitted] - The data without extra data, `omitExtraDataOf(current)`, when `omitExtraData`
 *        asks for it
 * @returns - The next state, sharing every unchanged subtree with `current`
 */
export function applySubmit<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
  omitted?: ExtraDataOmission<T>,
): FormState<T, S, F> {
  const revealed = withEveryErrorRevealed(current);
  return {
    ...(omitted ? withOmission(revealed, omitted) : revealed),
    ...extraErrorsAlone(props.extraErrors),
  };
}

/** The data the props seed the form with on mount and on `reset()`: `formData`, which is kept as another name for the
 * seed, or else `initialFormData`. Only `undefined` leaves a prop unpassed, so a `null` `formData` is the seed, and
 * seeds the same defaults an `undefined` does.
 *
 * @param props - The current props
 * @returns - The seed, or `undefined` when the props pass none
 */
export function seedOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
): T | undefined {
  // oxlint-disable-next-line typescript/no-deprecated -- the form still reads the deprecated alias
  const { formData } = props;
  if (formData === undefined) {
    return props.initialFormData;
  }
  return formData;
}

export function initialState<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
): FormState<T, S, F> {
  if (!props.validator) {
    throw new Error('A validator is required for Form functionality to work');
  }
  return deriveDataState(undefined, seedOf(props), props);
}

/** Derives the state to render from the props and the committed `state`. Nothing is remembered about the previous
 * props: every derived member is shared against the committed state, so an unchanged input hands back the reference
 * the fields already hold and a changed one is recognized by the new reference; when nothing changed, `state` itself
 * is handed back. The data is the form's own after mount, so a `formData` or `initialFormData` passed later changes
 * nothing; it is re-derived only for a schema, `ui:emptyValue`, `defaultFormStateBehavior` or
 * `additionalPropertiesWhenAbsent` change, and any other
 * prop change re-derives the render context alone, since an unrelated re-render must not rerun value initialization.
 *
 * @param props - The current props
 * @param state - The committed state
 * @returns - The state to render, `state` itself when nothing changed
 */
export function deriveState<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  state: FormState<T, S, F>,
): FormState<T, S, F> {
  const context = deriveRenderContext(props, state.retrievedSchema, state, resolveSchemaUtils(props, state));
  const { isSchemaChanged, isValidationPropChanged } = detectContextChanges(state, context);
  // Rebuilt schema utilities are not on their own a reason to rerun value initialization: they are rebuilt for a
  // recreated `validator` or `customMergeAllOf` as well, which parents commonly write inline, and re-deriving there
  // replaces data the user cleared or switched away from with the very default it came from (#5294). Only the props
  // that decide what the data should be do: the schema, the uiSchema's `ui:emptyValue`s, and the settings that decide
  // how the defaults are computed, an absent `additionalProperties` among them
  const isEmptyValueChanged =
    context.uiSchema !== state.uiSchema && !deepEquals(emptyValuesOf(context.uiSchema), emptyValuesOf(state.uiSchema));
  if (
    isSchemaChanged ||
    isEmptyValueChanged ||
    context.defaultsBehavior !== state.defaultsBehavior ||
    context.allowsAbsentAdditionalProperties !== state.allowsAbsentAdditionalProperties
  ) {
    return shareState(state, deriveDataState(state, state.formData, props));
  }
  // Resolved only once it is known the data is not re-derived, which resolves it itself
  const resolvedContext = {
    ...context,
    retrievedSchema: resolveRetrievedSchema(state, context.schemaUtils, state.formData),
  };
  const errors = reconcileErrors(state, props, resolvedContext, state.formData, {
    mustValidate: mustLiveValidate(props, state.isDataPassed, isValidationPropChanged),
    validationSchema: context.schemaUtils === state.schemaUtils ? resolvedContext.retrievedSchema : undefined,
  });
  return shareState(state, { ...state, ...resolvedContext, ...errors });
}
