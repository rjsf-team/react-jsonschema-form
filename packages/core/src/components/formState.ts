import type {
  ErrorSchema,
  FieldPath,
  FieldPathList,
  FormContextType,
  FormFieldState,
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
  getSchemaOwnTypes,
  guessType,
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
  fieldPathFromList,
  getChangedFields,
  getUiOptions,
  hashObject,
  isObject,
  isPlainObject,
  pickGlobalUiOptions,
  replaceEqualDeep,
  setOwn,
  toErrorList,
  fieldPathToList,
  UI_GLOBAL_OPTIONS_KEY,
  UI_OPTIONS_KEY,
  validationDataMerge,
  ERRORS_KEY,
  SCHEMA_KEY,
} from '@rjsf/utils';

import isDevelopment from '../isDevelopment.ts';
import { buildRegistry } from '../Theme.ts';
import { ADDITIONAL_PROPERTY_KEY_REMOVE } from './constants.ts';
import { copyAlongPath, getAt, isPathPrefix, replaceErrorSchemaNode } from './dataPaths.ts';
import {
  schemaFieldDrawsControlsBesideOptions,
  schemaFieldFallbackType,
  schemaFieldRendersArrayWidget,
} from './fields/SchemaField.tsx';
import type { FormProps, FormState } from './Form.tsx';
import type { EventFormData, IChangeEvent, NestedBooleans, RJSFFormStatus } from './IChangeEvent.ts';
import { clearsWrittenOver, holdsClearAt, keepRecordedClears } from './keepClears.ts';
import { keyMoveOf, moveErrorKeys, moveErrorSchemaKeys, movedPaths, withKeysMoved } from './keyMove.ts';
import type { ContainerKeyMove, KeyMove, MoveFate } from './keyMove.ts';
import type { DataOrigins, DroppedValue, FieldTree, FirstRenderFill, JudgedClears } from './sanitizeFieldTree.ts';
import sanitizeFieldTree, { judgedClearsIn } from './sanitizeFieldTree.ts';
import type { UiStateReader } from './uiState.ts';
import {
  asFieldValue,
  createUiState,
  fieldStateOf,
  jsonCopyOf,
  renderedSchemas,
  settledEntries,
  withoutSelections,
  withSelectionsAsOf,
  withSelectionsHeldFor,
  withSelectionsHeldForValidated,
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
  let container: object = isPlainObject(marks) ? marks : {};
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

/** The fields the user cleared, see `FormState.clearedPaths` */
export type ClearedPaths = ReadonlySet<FieldPath>;

/** The values a person entered through the form, see `FormState.enteredPaths` */
export type EnteredPaths = ReadonlySet<FieldPath>;

/** The values the seed held, see `FormState.seededPaths` */
export type SeededPaths = ReadonlySet<FieldPath>;

/** The values set aside when their field went away, see `FormState.orphans` */
export type Orphans = ReadonlyMap<FieldPath, unknown>;

const NO_ORPHANS: Orphans = new Map();

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

const NO_ORIGINS: DataOrigins = { entered: NO_PATHS, seeded: NO_PATHS };

/** The selections of a form that holds none */
const NO_SELECTIONS: UiStateReader = { selection: () => undefined, isExpanded: () => false };

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
  return Object.is(previous, next)
    ? paths
    : filterPaths(paths, (fieldPath) => !isPathDropped(fieldPath, previous, next));
}

/** `paths` without those `keep` turns down, `paths` itself when it turns none down */
function filterPaths(paths: ReadonlySet<FieldPath>, keep: (fieldPath: FieldPath) => boolean): ReadonlySet<FieldPath> {
  if (paths.size === 0) {
    return paths;
  }
  const kept = [...paths].filter(keep);
  return kept.length === paths.size ? paths : new Set(kept);
}

/** `paths` with `added` in it, `paths` itself when it holds them already */
function withPaths(paths: ReadonlySet<FieldPath>, ...added: FieldPath[]): ReadonlySet<FieldPath> {
  return added.every((path) => paths.has(path)) ? paths : new Set([...paths, ...added]);
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

/** `moved`, the paths a move left, with those under the keys of `container` settled after `transformChange` rewrote
 * the move, as `fateOf` says of each key: a path under a key holding what the move put there stays where the move put
 * it, one under a key holding what it held before the move comes back from `unmoved`, the paths before the move, and
 * any other is dropped
 */
export function settledPaths(
  moved: ReadonlySet<FieldPath>,
  unmoved: ReadonlySet<FieldPath>,
  container: FieldPath,
  fateOf: (key: string) => MoveFate,
): ReadonlySet<FieldPath> {
  return sameMembersOr(
    moved,
    settledEntries(moved, unmoved, (path) => path, container, fateOf),
  );
}

/** `state` with the touched and revealed paths settled after a move `transformChange` rewrote, see `settledPaths()` */
export function withMarksSettled<T, S extends StrictRJSFSchema, F extends FormContextType>(
  state: FormState<T, S, F>,
  unmoved: Pick<FormState<T, S, F>, 'touchedPaths' | 'revealed'>,
  container: FieldPath,
  fateOf: (key: string) => MoveFate,
): FormState<T, S, F> {
  const settle = (moved: ReadonlySet<FieldPath>, before: ReadonlySet<FieldPath>) =>
    settledPaths(moved, before, container, fateOf);
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

/** The marks that follow the data: the touched fields, the revealed ones and the recorded clears */
type DataMarks<T, S extends StrictRJSFSchema, F extends FormContextType> = Pick<
  FormState<T, S, F>,
  'touchedPaths' | 'revealed' | 'clearedPaths' | 'enteredPaths' | 'seededPaths'
>;

/** `paths` without the clears `formData` no longer holds, see `holdsClear()`: a clear holds only while the key is there
 * holding `undefined`, or the item `null`, so a key dropped or given a value starts again from its defaults. Skipped
 * for the clears `current` holds while its data is unchanged, since those held for that data. The rest are each
 * checked, wherever the change was: the defaults and the sanitize a change runs can drop or fill a key anywhere
 */
function heldClears<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  paths: ReadonlySet<FieldPath>,
  formData: unknown,
): ReadonlySet<FieldPath> {
  return paths === current.clearedPaths && Object.is(formData, current.formData)
    ? paths
    : filterPaths(paths, (fieldPath) => holdsClearAt(formData, fieldPathToList(fieldPath)));
}

/** The touched fields, the revealed ones and the recorded clears once the data went from `current`'s to `formData`:
 * each follows the keys `move` moved. The touched and revealed fields lose those dropped without a move, see
 * `withoutDroppedPaths()`, and the clears those `formData` no longer holds, see `heldClears()`
 *
 * @param current - The state before the change
 * @param formData - The data after it
 * @param [move] - Where the change moved the keys of a container
 * @param [clearedPaths] - The clears recorded through the change, already moved, in place of `current`'s
 * @param [origins] - The entered and seeded paths recorded through the change, already moved, in place of `current`'s
 */
function marksFollowingData<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  formData: T | undefined,
  move?: ContainerKeyMove,
  clearedPaths = withPathsMoved(current.clearedPaths, move),
  origins: DataOrigins = {
    entered: withPathsMoved(current.enteredPaths, move),
    seeded: withPathsMoved(current.seededPaths, move),
  },
): DataMarks<T, S, F> {
  const { touchedPaths, revealed } = current;
  const clears = heldClears(current, clearedPaths, formData);
  // A value the data no longer holds, as one a sanitize dropped, has no origin to keep
  const held = (paths: ReadonlySet<FieldPath>) =>
    filterPaths(paths, (fieldPath) => getAt(formData, fieldPathToList(fieldPath)) !== undefined);
  const enteredPaths = held(origins.entered);
  const seededPaths = held(origins.seeded);
  if (touchedPaths.size === 0 && revealed.fields.size === 0 && revealed.containers.size === 0) {
    return { touchedPaths, revealed, clearedPaths: clears, enteredPaths, seededPaths };
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
    clearedPaths: clears,
    enteredPaths,
    seededPaths,
  };
}

/** Where `change` moved the keys of a container, as the data went. The marks belong to the data, so they go where the
 * data went, as the validator's errors do, not where the fields' own errors go: a field both options of a switch
 * declare keeps its value, and its marks with it
 */
function dataMoveOf<T>(change: FieldChange<T>): ContainerKeyMove | undefined {
  return keyMoveOf({ ...change, newOwnKeyOf: undefined });
}

/** The marks after `change`, which left `formData`, with `clearedPaths`, the clears recorded through it: each follows
 * the keys it moved, see `marksFollowingData()`. Under `liveErrors: 'field'`, a change that moved
 * keys, or that a field announced as a move, as an added property is, reveals the container's own errors, and a
 * field's edit under `liveValidate: 'onChange'` reveals the field's. A root write standing for an edit reveals nothing
 * more: the edit revealed what it reached
 */
function marksAfterChange<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  change: FieldChange<T>,
  formData: T | undefined,
  props: FormProps<T, S, F>,
  clearedPaths: ReadonlySet<FieldPath>,
  origins: DataOrigins,
): DataMarks<T, S, F> {
  const move = dataMoveOf(change);
  const followed = marksFollowingData(current, formData, move, clearedPaths, origins);
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
  /** For a change that moved keys, the key whose value, before the change, each key it added copies; see
   * `AnnouncedMove`
   */
  sourceKeyOf?: KeyMove;
  /** Whether a field announced the change as a move, as an added property is though it moves no key, so it reaches the
   * array or object at `fieldPath` rather than the fields inside it
   */
  isAnnouncedMove?: boolean;
  /** Whether the fields' own errors stay as they are: a change no field made, such as the data a `transformChange`
   * writes over an edit, says nothing of what any field raised
   */
  keepsOwnErrors?: boolean;
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
  /** For an option switch, the option switched away from, the keys the form put back, and the selections the form held
   * before the switch
   */
  switchedFrom?: SwitchedFrom;
}

/** The keys a switch the form took put back, see `SwitchedOption`, at `path`, the switched field's, with the selections
 * and expansions the form showed the data under before it, which the field tree before the switch is read with below
 * those keys. The path is the change's own, or below it where a parent field sent the switch's data at its own path
 */
export interface SwitchedFrom {
  path: FieldPathList;
  heldKeys: ReadonlySet<string>;
  uiState: UiStateReader;
}

/** A change being made to the data: its path, where it moved the keys of the array or object there, if it moved any,
 * and the option it switched away from, with the keys the form put back, if it is a switch
 */
export interface FieldEdit {
  path: FieldPathList;
  newKeyOf?: KeyMove;
  switchedFrom?: SwitchedFrom;
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
  const { schema, validator, defaultFormStateBehavior, customMergeAllOf, additionalPropertiesWhenAbsent, widgets } =
    props;
  const schemaContext: SchemaContext<S, F> = {
    validator,
    defaultFormStateBehavior,
    customMergeAllOf,
    additionalPropertiesWhenAbsent,
    widgets,
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
 * @param [shownData=formData] - The data the form shows, which `formData` is with extra data omitted on a submit,
 *          `validateForm()` or a `liveOmit: 'onBlur'` blur
 */
export function validateFormData<T, S extends StrictRJSFSchema, F extends FormContextType>(
  props: FormProps<T, S, F>,
  context: RenderContext<T, S, F>,
  formData: T | undefined,
  retrievedSchema?: S,
  heldPath?: FieldPathList,
  shownData: T | undefined = formData,
): ValidationData<T> {
  const { schemaUtils, schema } = context;
  const { customValidate, transformErrors, uiSchema, formContext } = props;
  // When a pre-resolved schema is provided (e.g., from live validation), use it directly.
  // Otherwise validate against the original schema so AJV sees the full constraint set.
  const validationSchema = retrievedSchema ?? schema;
  // JSON.stringify drops keys with `undefined` values; JSON.parse on the result gives AJV a clean
  // object that avoids spurious type errors for `type: "string"` fields that were cleared (#4518).
  // Falsy root values (`false`, `0`, `''`) are valid data, so only `undefined` skips the round trip (#5404).
  const validationFormData = jsonCopyOf(formData) as T | undefined;
  // The committed registry's fields, not the props', since whether an option is hidden is a question of what renders.
  // A selection holding for the data the form shows holds for the validated data and its copy too, as the ui:required
  // walk reads the one and the defaults for `customValidate` are taken from the other
  const fieldState = fieldStateOf(
    withSelectionsHeldForValidated(
      context.uiState,
      (at) => getAt(shownData, at),
      (at) => [getAt(formData, at), getAt(validationFormData, at)],
    ),
    schemaUtils,
    heldPath,
    (_fieldPath, fieldSchema, fieldUiSchema, data) =>
      schemaFieldDrawsControlsBesideOptions<T, S, F>(
        context.registry,
        fieldSchema,
        // `FormFieldState` carries no `T` or `F`, and hands back the `UiSchema<T, S, F>` `getUiRequiredErrorSchema()` gave it
        fieldUiSchema as UiSchema<T, S, F>,
        asFieldValue<T>(data),
      ),
    (fieldPath, fieldSchema, fieldUiSchema, data, depth) =>
      schemaFieldFallbackType<T, S, F>(
        context.registry,
        context.uiState,
        fieldPath,
        fieldSchema,
        // As above, `FormFieldState` hands back the `UiSchema<T, S, F>` `getUiRequiredErrorSchema()` gave it
        fieldUiSchema as UiSchema<T, S, F>,
        asFieldValue<T>(data),
        depth,
      ),
    (_fieldPath, fieldSchema, fieldUiSchema, data) =>
      schemaFieldRendersArrayWidget<T, S, F>(
        context.registry,
        fieldSchema,
        // As above
        fieldUiSchema as UiSchema<T, S, F>,
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
 * @param [shownData=formData] - The data the form shows, when `formData` is that data with extra data omitted
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
  shownData: T | undefined = formData,
) {
  const schemaValidation = validateFormData(props, context, formData, retrievedSchema, heldPath, shownData);
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
  /** The pass's `clearedPaths`, moved with the items the sanitize dropped, see `settleFormData()` */
  clearedPaths: ReadonlySet<FieldPath>;
  /** The pass's entered and seeded paths, moved the same way */
  origins: DataOrigins;
  /** The orphans after the pass: those it was handed, without the ones it brought back, and the values it dropped */
  orphans: Orphans;
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
  /** The clears the form records through this pass. A sanitize that drops an item moves the items after it down, and
   * the clears with them, so the pass hands them back moved, see `settleFormData()`
   */
  clearedPaths?: ReadonlySet<FieldPath>;
  /** The entered and seeded paths of the data the pass starts from, which tell where each of its values came from,
   * and are handed back moved as the clears are
   */
  origins?: DataOrigins;
  /** The entered and seeded paths once the change this pass is for wrote its data, when they differ from `origins`:
   * the first round's sanitize diffs against the data before the change, and every later one against data the change
   * wrote
   */
  originsAfterEdit?: DataOrigins;
  /** The values set aside before the pass, which it brings back where their field shows again */
  orphans?: Orphans;
  /** Whether the pass leaves the orphans where they are: one that has just brought some back does, so a value whose
   * own return hides its field again is not brought back in a loop
   */
  keepsOrphans?: boolean;
  /** For a disabled or read-only form: the sanitize judges only the recorded clears and the keys holding `undefined`,
   * see `sanitizeFieldTree()`. Being disabled or read-only changes neither the values the data holds nor which clears
   * are kept, and a clear gives way as in an enabled form. With neither there is nothing to judge, so the pass isn't
   * sanitized
   */
  judgesOnlyClears?: boolean;
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
  /** Keep `clearedPaths` through every fill, see `keepRecordedClears()`, so the schema each round resolves describes
   * the data with its clears
   */
  keepsClears?: boolean;
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
  const { formData, retrievedSchema, clearedPaths, origins, orphans } = settleFormData(
    current,
    inputFormData,
    options,
    props,
    schemaUtils,
  );
  // Always derived, never skipped on the grounds that the schema utilities were reused: the registry is built from
  // `idPrefix`, the components in `widgets`, `templates`, `fields`, `formContext` and `uiSchema` too, none of which the
  // utilities are resolved from. `deriveRenderContext()` shares its result against `current`, so an unchanged context
  // keeps every reference the fields hold.
  const context = deriveRenderContext(props, retrievedSchema, current, schemaUtils);
  return {
    formData,
    clearedPaths,
    origins,
    orphans,
    context,
    areSchemaUtilsReused: schemaUtils === current?.schemaUtils,
  };
}

/** The data half of `deriveFormData()`, with the schema utilities it settles the data with already resolved
 *
 * @param [previousRetrievedSchema] - For data `current.retrievedSchema` wasn't resolved for, as the baseline, the
 *   schema `current`'s utilities resolve for it, which the sanitize diffs against: asked only if the pass sanitizes
 * @returns - The settled data, the schema resolved for it, and the pass's `clearedPaths`, moved with the items each
 *   round's sanitize dropped
 */
function settleFormData<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F> | undefined,
  inputFormData: T | undefined,
  options: DeriveDataOptions,
  props: FormProps<T, S, F>,
  schemaUtils: SchemaUtilsType<T, S, F>,
  previousRetrievedSchema?: () => S,
): {
  formData: T | undefined;
  retrievedSchema: S;
  clearedPaths: ReadonlySet<FieldPath>;
  origins: DataOrigins;
  orphans: Orphans;
} {
  const { isSanitized, edit, heldPath, isReset = false, judgesOnlyClears, keepsClears } = options;
  let clearedPaths = options.clearedPaths ?? NO_PATHS;
  const dropped: DroppedValue[] = [];
  let diffedOrigins = options.origins ?? NO_ORIGINS;
  let origins = options.originsAfterEdit ?? diffedOrigins;
  const uiState = options.uiState ?? current?.uiState;
  const { uiSchema = {} } = props;
  // The data is shared against the committed data when there is some, so an unchanged subtree keeps the reference the
  // fields hold; on construction, against the caller's own value
  const shareBase = current ? current.formData : inputFormData;
  // A reset re-runs the same "initial" defaults pass a first render does, so `ui:initialValue` applies again even
  // though this instance has generated defaults before.
  const initialDefaultsGenerated = (current?.initialDefaultsGenerated ?? false) && !isReset;
  // The defaults of a field offering options are those of the option it shows, which is the form's to keep
  // A value in an array is left as the data holds it: an array's `default` fills its rows by position, so one computed
  // again after a row moved would land in another row
  const isFilled = (fieldPath: FieldPath) =>
    !origins.entered.has(fieldPath) &&
    !origins.seeded.has(fieldPath) &&
    !fieldPathToList(fieldPath).some((key) => typeof key === 'number');
  // A pass told nothing of where its values came from takes none for a filled one
  const knowsOrigins = options.origins !== undefined || options.originsAfterEdit !== undefined;
  // On construction the form holds no selection yet, and the option each field shows is asked for all the same, so the
  // mount fills the data under the option every later pass will show it under (#5832)
  const fieldState = {
    ...fieldStateOf(uiState ?? NO_SELECTIONS, schemaUtils, heldPath),
    ...(knowsOrigins && { isFilled }),
  };
  const defaultsOf = (
    utils: SchemaUtilsType<T, S, F>,
    ui: UiSchema<T, S, F> | undefined,
    data: T | undefined,
    areInitialDefaultsGenerated: boolean,
    state: FormFieldState<S> | undefined,
  ) => utils.getDefaultFormState(utils.getRootSchema(), data, false, areInitialDefaultsGenerated, ui, undefined, state);
  const fillAsFirstRender: FirstRenderFill<T, S, F> = (tree, data, state) =>
    defaultsOf(tree.schemaUtils, tree.uiSchema, data, false, state);
  const fill = (data: T | undefined) => {
    const filled = replaceEqualDeep(
      shareBase,
      asFilledFormData<T>(defaultsOf(schemaUtils, uiSchema, data, initialDefaultsGenerated, fieldState)),
    );
    return keepsClears ? keepRecordedClears(filled, data, Array.from(clearedPaths, fieldPathToList)) : filled;
  };
  let formData = fill(inputFormData);
  // Built once per round, for the data the round sanitizes, and handed to the sanitize rather than walked again there
  const judgedOf = (data: T | undefined): JudgedClears | undefined =>
    judgesOnlyClears ? judgedClearsIn(data, clearedPaths) : undefined;
  let judged = judgedOf(formData);
  const sanitizes = isSanitized && judged?.along.size !== 0;
  const base =
    current && sanitizes && previousRetrievedSchema
      ? { ...current, retrievedSchema: previousRetrievedSchema() }
      : current;
  const treeOf = (data: T | undefined): FieldTree<T, S, F> => ({
    schemaUtils,
    formData: data,
    retrievedSchema: resolveRetrievedSchema(base, schemaUtils, data),
    uiSchema,
  });
  let tree = treeOf(formData);
  if (base && uiState && sanitizes) {
    const seen: string[] = [];
    let previous: FieldTree<T, S, F> = base;
    let roundEdit = edit;
    // Settings that compute the defaults another way can fill a field anew whose schema and value didn't change
    let isDefaultsChanged = !deepEqualsUndefinedAsMissing(
      base.defaultsBehavior ?? {},
      props.defaultFormStateBehavior ?? {},
    );
    for (;;) {
      const round = sanitizeFieldTree(previous, tree, uiState, fillAsFirstRender, diffedOrigins, roundEdit, judged);
      dropped.push(...round.dropped);
      const sanitized = replaceEqualDeep(formData, round.formData);
      // Wrapped in an object to deal with a scalar or `undefined` value. Data a round has already produced would only
      // produce it again, which ends a loop of conditions that flip each other. It ends filled, as every other pass
      // does, so a default the round dropped is there again
      if (sanitized === formData) {
        break;
      }
      clearedPaths = round.itemMoves.reduce(withPathsMoved, clearedPaths);
      origins = {
        entered: round.itemMoves.reduce(withPathsMoved, origins.entered),
        seeded: round.itemMoves.reduce(withPathsMoved, origins.seeded),
      };
      diffedOrigins = origins;
      const hash = hashObject({ formData: sanitized });
      if (seen.includes(hash)) {
        formData = fill(sanitized);
        break;
      }
      seen.push(hash);
      previous = tree;
      // Only the first round diffs against the data before the move: every later one diffs against data already moved
      roundEdit = edit && { path: edit.path };
      isDefaultsChanged = false;
      formData = fill(sanitized);
      tree = treeOf(formData);
      judged = judgedOf(formData);
    }
  }
  const { retrievedSchema } = tree.formData === formData ? tree : treeOf(formData);
  // A value dropped at a path replaces one set aside there before: it is the one last entered for the field
  const setAside = new Map(options.orphans);
  dropped.forEach(({ path, value }) => setAside.set(fieldPathFromList(path), value));
  const orphans: Orphans = setAside.size === 0 ? NO_ORPHANS : setAside;
  const droppedNow = new Set(dropped.map(({ path }) => fieldPathFromList(path)));
  const returning =
    uiState && !options.keepsOrphans
      ? returningOrphans(orphans, droppedNow, uiState, schemaUtils, retrievedSchema, formData, origins)
      : [];
  if (returning.length === 0) {
    return { formData, retrievedSchema, clearedPaths, origins, orphans };
  }
  // Each returns as the person's value, and the data is settled again with them in it
  let restored: unknown = formData;
  const remaining = new Map(orphans);
  const entered: FieldPath[] = [];
  for (const [fieldPath, value] of returning) {
    const path = fieldPathToList(fieldPath);
    restored = isObject(restored) ? copyAlongPath(restored, path) : {};
    setByPath(restored, path, value);
    remaining.delete(fieldPath);
    entered.push(...leafPathsOf(value, fieldPath));
  }
  return settleFormData(
    current,
    asFilledFormData<T>(restored),
    {
      ...options,
      clearedPaths,
      origins: diffedOrigins,
      originsAfterEdit: { entered: withPaths(origins.entered, ...entered), seeded: origins.seeded },
      orphans: remaining,
      keepsOrphans: true,
    },
    props,
    schemaUtils,
    previousRetrievedSchema,
  );
}

/** The orphans that return to the data: each whose path shows a field again, of a type that takes the value, where
 * the data holds no value a person or a seed put there. One the pass itself dropped stays out
 *
 * @param orphans - The values set aside
 * @param droppedNow - The paths of the values this pass dropped
 * @param uiState - The form's option selections
 * @param schemaUtils - The schema utilities the data is settled with
 * @param retrievedSchema - The schema retrieved for `formData`
 * @param formData - The settled data
 * @param origins - Where the values of `formData` came from
 * @returns - The path and value of each orphan that returns, an outer path before one inside it
 */
function returningOrphans<T, S extends StrictRJSFSchema, F extends FormContextType>(
  orphans: Orphans,
  droppedNow: ReadonlySet<FieldPath>,
  uiState: UiStateReader,
  schemaUtils: SchemaUtilsType<T, S, F>,
  retrievedSchema: S,
  formData: T | undefined,
  origins: DataOrigins,
): [FieldPath, unknown][] {
  if (orphans.size === 0) {
    return [];
  }
  const schemaAt = renderedSchemas<T, S, F>(uiState, schemaUtils, retrievedSchema, formData);
  return [...orphans]
    .filter(([fieldPath, value]) => {
      const path = fieldPathToList(fieldPath);
      const schema = droppedNow.has(fieldPath) ? undefined : schemaAt(path);
      const held = getAt<unknown>(formData, path);
      const isHeld = held !== undefined && (origins.entered.has(fieldPath) || origins.seeded.has(fieldPath));
      return schema !== undefined && !isHeld && takesTypeOf<S>(schema, value);
    })
    .sort(([a], [b]) => a.length - b.length);
}

/** Whether a field of `schema` can hold a value of the JSON type `value` has, as a schema declaring no type can */
function takesTypeOf<S extends StrictRJSFSchema>(schema: S, value: unknown): boolean {
  const types = getSchemaOwnTypes<S>(schema);
  const valueType = guessType(value);
  return (
    types === undefined ||
    types.length === 0 ||
    types.some((type) => type === valueType || (type === 'integer' && Number.isInteger(value)))
  );
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
  // A schema change sanitizes the data for the new schema's tree, as an edit does for the tree it leads to, and judges
  // only the clears of a disabled or read-only form, as an edit there does
  const options: DeriveDataOptions = {
    isSanitized: true,
    clearedPaths: current?.clearedPaths,
    origins: current && originsOf(current),
    orphans: current?.orphans,
    judgesOnlyClears: props.disabled || props.readonly,
    keepsClears: fillsOverClears(props),
  };
  const { formData, clearedPaths, origins, orphans, context, areSchemaUtilsReused } = deriveFormData(
    current,
    inputFormData,
    options,
    props,
  );
  const { isSchemaChanged, isValidationPropChanged } = detectContextChanges(current, context);
  const baseline = current ? rederiveBaseline(current, formData, options, props, context.schemaUtils) : formData;
  // Construction validates nothing: the errors of a seed the user has not touched are not shown until they are earned
  const isDataChanged = current !== undefined && formData !== current.formData;
  const isDataPassed = current ? current.isDataPassed : inputFormData !== undefined;
  // On construction what the data holds of the seed is seeded, and nobody has entered anything
  const seededPaths = current ? undefined : leafPathsIn(inputFormData);
  const marks = current
    ? marksFollowingData(current, formData, undefined, clearedPaths, origins)
    : {
        touchedPaths: NO_PATHS,
        revealed: NOTHING_REVEALED,
        clearedPaths: NO_PATHS,
        enteredPaths: NO_PATHS,
        seededPaths: seededPaths ?? NO_PATHS,
      };
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
    baselineSeededPaths: current?.baselineSeededPaths ?? seededPaths ?? NO_PATHS,
    orphans,
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
  // The recorded clears are the data's, so the baseline of a disabled or read-only form has only its keys holding
  // `undefined` to judge. The baseline's own schema, which the sanitize diffs against, is resolved only if it sanitizes
  return settleFormData(
    { ...current, formData: baseline },
    baseline,
    {
      ...options,
      clearedPaths: NO_PATHS,
      origins: { entered: NO_PATHS, seeded: current.baselineSeededPaths },
      keepsClears: false,
      uiState: withSelectionsHeldFor(current.uiState, current.baselineUiState, (at) => getAt(baseline, at)),
    },
    props,
    schemaUtils,
    () => resolveRetrievedSchema(current, current.schemaUtils, baseline),
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

/** The path whose field and the fields above it keep the options they show for the data `change` leaves, see
 * `fieldStateOf()`: the edit's, for a change a field made, the root's included. Data set from outside, as
 * `setFieldValue()` sets it at any path, holds none, so it is matched again, as the render matches it
 */
function heldPathOf<T>(change: FieldChange<T>): FieldPathList | undefined {
  if (!change.isFieldEdit) {
    return undefined;
  }
  // A switch a parent field forwarded holds at the switched field, as the switch's own change would
  return change.switchedFrom?.path ?? change.editedPath ?? fieldPathToList(change.fieldPath);
}

/** Whether the form's defaults can replace an own `undefined`: only this mode's fill does, so under the others the
 * fill has no recorded clear to keep. The clears are recorded under every mode, so a switch to this one keeps them
 *
 * @param props - The current props
 * @returns - True if the fill replaces a clear
 */
function fillsOverClears<T, S extends StrictRJSFSchema, F extends FormContextType>(props: FormProps<T, S, F>): boolean {
  return props.defaultFormStateBehavior?.mergeDefaultsIntoFormData === 'useDefaultIfFormDataUndefined';
}

/** `paths` without the path `prefix` and those under it */
function withoutPathsUnder(paths: ReadonlySet<FieldPath>, prefix: FieldPathList): ReadonlySet<FieldPath> {
  return filterPaths(paths, (fieldPath) => !isPathPrefix(prefix, fieldPathToList(fieldPath)));
}

/** The clears `recorded` holds under each item the move at `path` copied, recorded again under the copy, see
 * `FieldChange.sourceKeyOf`. An item the move added that copies none, as an added one, holds none
 */
function clearsOfCopies<T>(
  recorded: ReadonlySet<FieldPath>,
  { sourceKeyOf }: FieldChange<T>,
  written: unknown,
  path: FieldPathList,
): FieldPath[] {
  const items = getAt<unknown>(written, path);
  if (!sourceKeyOf || !Array.isArray(items)) {
    return [];
  }
  return items.flatMap((_, index) => {
    const source = sourceKeyOf(String(index));
    const copy = [...path, index];
    return source === undefined
      ? []
      : [...movedPaths(recorded, path, (key) => (key === source ? String(index) : undefined))].filter((at) =>
          isPathPrefix(copy, fieldPathToList(at)),
        );
  });
}

/** The path of each value `data` holds that is no array or object */
function leafPathsIn(data: unknown): ReadonlySet<FieldPath> {
  const paths = leafPathsOf(data, fieldPathFromList([]));
  return paths.length === 0 ? NO_PATHS : new Set(paths);
}

/** Adds to `entered` the path of each value under `written`, at `path`, that is no array or object and that
 * `committed` does not hold there as the same value, where `hasCommitted` says there is such data to compare with. A
 * field that writes an array or object hands back what it left alone by reference, so what differs is what was entered
 */
function collectEntered(
  written: unknown,
  committed: unknown,
  hasCommitted: boolean,
  path: FieldPathList,
  entered: FieldPath[],
): void {
  if (hasCommitted && Object.is(written, committed)) {
    return;
  }
  if (Array.isArray(written) || isPlainObject(written)) {
    const isSameKind = hasCommitted && Array.isArray(written) === Array.isArray(committed) && isObject(committed);
    for (const [key, value] of Object.entries(written)) {
      const at = Array.isArray(written) ? Number(key) : key;
      const has = isSameKind && hasByPath(committed, at);
      collectEntered(value, has ? getByPath(committed, at) : undefined, has, [...path, at], entered);
    }
  } else if (written !== undefined) {
    entered.push(fieldPathFromList(path));
  }
}

/** The entered and seeded paths `state` holds */
function originsOf<T, S extends StrictRJSFSchema, F extends FormContextType>({
  enteredPaths,
  seededPaths,
}: FormState<T, S, F>): DataOrigins {
  return { entered: enteredPaths, seeded: seededPaths };
}

/** The entered and seeded paths once `change` wrote `written` over `committed`, before any defaults merge in: those
 * recorded before, moved with the keys the change moved, and those the change entered, which are no longer the
 * seed's. A field's edit enters the value it writes, and each value an array or object it writes holds that the data
 * did not. A change that moves keys, adds one or switches an option enters nothing: what it adds is the field's seed
 * for the new key or option, which the defaults give. Data written from outside, as `setFieldValue()` and a
 * `transformChange` rewrite write it, enters what it holds that the data did not
 *
 * @param recorded - The entered and seeded paths recorded before the change
 * @param change - The change
 * @param committed - The data before the change
 * @param written - The data the change wrote, before any defaults
 * @param path - The path of the change
 * @returns - The paths recorded through the change, before those the derived data no longer holds are dropped
 */
function originsAfterChange<T>(
  recorded: DataOrigins,
  change: FieldChange<T>,
  committed: T | undefined,
  written: T | undefined,
  path: FieldPathList,
): DataOrigins {
  const move = dataMoveOf(change);
  const moved = { entered: withPathsMoved(recorded.entered, move), seeded: withPathsMoved(recorded.seeded, move) };
  if (change.newKeyOf || change.isAnnouncedMove || change.switchedFrom) {
    return moved;
  }
  const entered: FieldPath[] = [];
  const has = path.every((_key, depth) => hasByPath(getAt<unknown>(committed, path.slice(0, depth)), path[depth]));
  collectEntered(getAt<unknown>(written, path), has ? getAt<unknown>(committed, path) : undefined, has, path, entered);
  // A value no array or object the write replaced is what the field now holds, entered or cleared: one written again
  // as the value it was is entered all the same, since the person chose it
  const fieldPath = fieldPathFromList(path);
  const value = getAt<unknown>(written, path);
  if (value !== undefined && !isObject(value) && !Array.isArray(value) && !entered.includes(fieldPath)) {
    entered.push(fieldPath);
  }
  const overwritten = new Set([fieldPath, ...entered]);
  return {
    entered: withPaths(
      filterPaths(moved.entered, (at) => at !== fieldPath),
      ...entered,
    ),
    seeded: filterPaths(moved.seeded, (at) => !overwritten.has(at)),
  };
}

/** The clears the form records once `change` wrote `written` over `committed`, before any defaults merge in: those
 * recorded before, moved with the keys the change moved, and the ones the change made. A field's edit that leaves its
 * field without a value, `undefined` or a `null` item, is a clear, and so is each key or item a field's write of an
 * array or object leaves without a value where the data held one. A key move drops the clear of the field it rewrites,
 * as an option switch leaving a scalar field without a value does, whose `undefined` is for the defaults to fill, and
 * gives each item it copies the clears of the item it copies. Data written from outside, as `setFieldValue()` writes
 * it, drops the clears at and under its path, so it is left to its defaults, while those elsewhere stay. A `transformChange` rewrite records none of its own: it keeps those of the edit it stands for, while
 * its data still holds them
 *
 * @param recorded - The clears recorded before the change
 * @param change - The change
 * @param committed - The data before the change
 * @param written - The data the change wrote, before any defaults
 * @param path - The path of the change
 * @returns - The clears recorded through the change, before those the derived data no longer holds are dropped
 */
function clearsAfterChange<T>(
  recorded: ReadonlySet<FieldPath>,
  change: FieldChange<T>,
  committed: T | undefined,
  written: T | undefined,
  path: FieldPathList,
): ReadonlySet<FieldPath> {
  const moved = withPathsMoved(recorded, dataMoveOf(change));
  const { newValue, newKeyOf, isFieldEdit, editedPath } = change;
  if (editedPath) {
    return moved;
  }
  if (!isFieldEdit) {
    return withoutPathsUnder(moved, path);
  }
  const fieldPath = fieldPathFromList(path);
  if (newKeyOf) {
    const kept = filterPaths(moved, (at) => at !== fieldPath);
    return withPaths(kept, ...clearsOfCopies(recorded, change, written, path));
  }
  if (isObject(newValue) || Array.isArray(newValue)) {
    return withPaths(
      moved,
      ...clearsWrittenOver(newValue, getAt<unknown>(committed, path), path).map(fieldPathFromList),
    );
  }
  return holdsClearAt(written, path) ? withPaths(moved, fieldPath) : moved;
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

  const isContainer = isObject(formData) || Array.isArray(formData);
  if (isContainer) {
    if (newValue === ADDITIONAL_PROPERTY_KEY_REMOVE) {
      // For additional properties, this key was explicitly removed, so unset it
      unsetByPath(formData, path);
    } else if (!isRootPath) {
      // A cleared array item is written as `null`, as ArrayField's `handleChange` writes it, since AJV needs `null`
      const isArrayItem = typeof path[path.length - 1] === 'number';
      setByPath(formData, path, newValue === undefined && isArrayItem ? null : newValue);
    }
  }
  let clearedPaths = clearsAfterChange(current.clearedPaths, change, oldFormData, formData, path);
  let origins = originsAfterChange(originsOf(current), change, oldFormData, formData, path);
  let { orphans } = current;

  if (isContainer) {
    // Only the data and its context are derived here; the errors are reconciled below. A root write is sanitized only
    // where it stands for an edit, as the data a `transformChange` writes over one does, or where it is an option
    // switch that put keys back for the sanitize to judge. The `undefined` a clear leaves is stripped from the copy the
    // validator gets, so AJV never sees `{ [key]: undefined }` for a `string` field (#4518)
    const editedPath = change.editedPath ?? (isRootPath && !change.switchedFrom ? undefined : path);
    const derived = deriveFormData(
      current,
      formData,
      {
        isSanitized: editedPath !== undefined,
        clearedPaths,
        // The sanitize diffs against the data before the change, whose entered paths are the committed ones
        origins: originsOf(current),
        originsAfterEdit: origins,
        orphans: current.orphans,
        judgesOnlyClears: disabled || readonly,
        // A switch a parent field sent at its own path is still an edit at the switched field, which holds the user's
        // value and the selections at and above it; the parent's write moves no key
        edit: editedPath && {
          path: change.switchedFrom?.path ?? editedPath,
          newKeyOf: change.editedPath ? undefined : change.newKeyOf,
          switchedFrom: change.switchedFrom,
        },
        heldPath: heldPathOf(change),
        keepsClears: fillsOverClears(props),
      },
      props,
    );
    formData = derived.formData;
    clearedPaths = derived.clearedPaths;
    origins = derived.origins;
    orphans = derived.orphans;
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
    ...marksAfterChange(current, change, omitted.formData, props, clearedPaths, origins),
    orphans,
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
  const seededPaths = leafPathsIn(seed);
  const { formData, context } = deriveFormData(
    current,
    seed,
    { isReset: true, origins: { entered: NO_PATHS, seeded: seededPaths } },
    props,
  );
  return {
    ...current,
    ...context,
    formData,
    baseline: formData,
    baselineUiState: withSelectionsAsOf(context.uiState, (at) => getAt(formData, at)),
    touchedPaths: NO_PATHS,
    revealed: NOTHING_REVEALED,
    clearedPaths: NO_PATHS,
    enteredPaths: NO_PATHS,
    seededPaths,
    baselineSeededPaths: seededPaths,
    orphans: NO_ORPHANS,
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
        current.formData,
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
 * @param [shownData=formData] - The data the form shows, when `formData` is that data with extra data omitted
 * @returns - The blocking flag and the next state, which carries the errors to report
 */
export function applyValidation<T, S extends StrictRJSFSchema, F extends FormContextType>(
  current: FormState<T, S, F>,
  props: FormProps<T, S, F>,
  formData: T | undefined,
  shownData: T | undefined = formData,
): { hasError: boolean; next: FormState<T, S, F> } {
  const { extraErrors, extraErrorsAreWarnings } = props;
  const { errors: prevErrors, customErrors } = current;
  const schemaValidation = validateFormData(props, current, formData, undefined, undefined, shownData);
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
