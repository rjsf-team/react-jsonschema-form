import type {
  FieldPath,
  FieldPathList,
  FormContextType,
  FormFieldState,
  SchemaUtilsType,
  StrictRJSFSchema,
} from '@rjsf/utils';
import {
  constrainsValue,
  deepEquals,
  fieldPathToList,
  getByPath,
  getDiscriminatorFieldFromSchema,
  getValidationTarget,
  getXxxOfOptions,
  isConstantOptionList,
  isObject,
  isSchemaObject,
  PROPERTIES_KEY,
  REQUIRED_KEY,
  ROOT_FIELD_PATH,
  toFieldPath,
} from '@rjsf/utils';
import type { JSONSchema7TypeName } from 'json-schema';

import { isPathPrefix } from './dataPaths.ts';
import { movedPath, movedPaths } from './keyMove.ts';
import type { KeyMove, MoveFate } from './keyMove.ts';

/** The option selected for a field's option list, and the field's data it holds for, see `useOptionSelection()` */
export interface OptionSelection {
  readonly index: number;
  /** Which pick of the user's the selection was made by, unique within the form: a field observes every pick by it,
   * since picking the selected option again shows it where the data showed another
   */
  readonly pick: number;
  /** The field's data as the form last rendered it under the selection, or as the last change since left it. Empty once
   * the form rendered other data, which the selection is then only the preference in matching
   */
  readonly holdsFor: readonly unknown[];
  /** Whether an edit to a property of the object's own that the options can disagree about was made since the form
   * last rendered: the data it leaves is matched again
   */
  readonly isReleased: boolean;
}

/** The key a field's option list is stored under: the list's place in the root schema, which each option's place
 * (`getValidationTarget()`'s pointer) ends in, so a condition that swaps the list the field offers starts the choice
 * over and finds the old one again when it swaps back, and a schema that changes the list in place keeps it
 *
 * @param options - The options, each retrieved for the field's data
 * @param rootSchema - The root schema
 * @returns - The key, empty for a list with no place in the root
 */
export function optionListKey<S extends StrictRJSFSchema>(options: readonly S[], rootSchema: S): string {
  for (const option of options) {
    const ref = getValidationTarget<S>(option, rootSchema).$ref;
    if (typeof ref === 'string') {
      return ref.slice(0, ref.lastIndexOf('/'));
    }
  }
  return '';
}

/** The option a field shows for `formData`. With no `selection`, the option `getClosestMatchingOption()` picks. A
 * selection holds for the data in its `holdsFor`, and, while `holds` says an edit is being made below the field, for
 * any data unless the selection is released. Other data, from outside the field or from an edit to a property of the
 * object's own that the options can disagree about, is matched again, with the selection preferred where it fits the
 * data as well as any other option. Data holding a value for the declared `discriminator` is always matched: the discriminator
 * names the option, so an edit to it is a switch.
 *
 * @param schemaUtils - The schema utilities to match with
 * @param selection - The stored selection, if any
 * @param options - The options, each retrieved for `formData`
 * @param formData - The field's data
 * @param [discriminator] - The property the options are told apart by, if any
 * @param [holds=false] - Whether an edit below the field is being made, which keeps a selection it did not release
 *        whatever the data
 * @returns - The index of the option shown, -1 when there are none
 */
export function shownOption<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  selection: OptionSelection | undefined,
  options: readonly S[],
  formData: T | undefined,
  discriminator?: string,
  holds = false,
): number {
  if (options.length === 0) {
    return -1;
  }
  const isDiscriminated = discriminator !== undefined && getByPath(formData, discriminator) !== undefined;
  if (
    selection !== undefined &&
    selection.index < options.length &&
    !isDiscriminated &&
    ((holds && !selection.isReleased && selection.holdsFor.length > 0) || isHeldFor(selection, formData))
  ) {
    return selection.index;
  }
  return schemaUtils.getClosestMatchingOption(formData, [...options], selection?.index ?? -1, discriminator);
}

/** The selection once an edit left `data` at its field. One that holds for no data, or that the edit released, is
 * left as it is, so the data the edit leaves is matched again
 */
function heldAfterEdit(selection: OptionSelection, data: unknown): OptionSelection {
  if (selection.holdsFor.length === 0 || selection.isReleased) {
    return selection;
  }
  return { ...selection, holdsFor: [data] };
}

const EMPTY_SCHEMA: StrictRJSFSchema = Object.freeze({});

/** The empty schema a field renders a boolean option as, one object for every render, so that retrieving it reuses the
 * memos keyed on the schema rather than parsing a new one each time
 */
function emptySchema<S extends StrictRJSFSchema>(): S;
function emptySchema(): StrictRJSFSchema {
  return EMPTY_SCHEMA;
}

/** `options`, each retrieved for `formData` */
function retrieveEach<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  options: readonly S[],
  formData: T | undefined,
): S[] {
  return options.map((option) =>
    schemaUtils.retrieveSchema(isSchemaObject<S>(option) ? option : emptySchema<S>(), formData),
  );
}

/** The options of a field whose retrieved schema is `view`, each retrieved for `formData`, constants included;
 * undefined where it offers none. An `AnyOfField` or `OneOfField` named through `ui:field` renders these
 */
export function retrievedOptionListOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  view: S,
  formData: T | undefined,
): S[] | undefined {
  const options = getXxxOfOptions<S>(view)?.options;
  return options && retrieveEach<T, S, F>(schemaUtils, options, formData);
}

/** The options of a field whose retrieved schema is `view`, each retrieved for `formData`; undefined where it offers
 * none, or only constants, which a select renders instead. `SchemaField` retrieves the options it renders with this,
 * where its `uiSchema` lets them render; the sanitize walk, which reads no `uiSchema`, takes them as rendered wherever
 * there are any
 */
export function retrievedOptionsOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  schemaUtils: SchemaUtilsType<T, S, F>,
  view: S,
  formData: T | undefined,
): S[] | undefined {
  const options = getXxxOfOptions<S>(view)?.options;
  return !options || isConstantOptionList<S>(options)
    ? undefined
    : retrieveEach<T, S, F>(schemaUtils, options, formData);
}

/** Whether `keyword` of an option, with `value`, can tell data apart by what it holds at `property`. `properties` and
 * `required` can only where they name the property; any other keyword that constrains the value, such as
 * `minProperties` or `not`, reads the object whole, and one that constrains nothing, `type` included since an edit to a
 * property leaves the data the object it was, reads nothing
 */
function keywordReads(keyword: string, value: unknown, property: string): boolean {
  if (keyword === PROPERTIES_KEY) {
    return !isObject(value) || Object.hasOwn(value, property);
  }
  if (keyword === REQUIRED_KEY) {
    return !Array.isArray(value) || value.includes(property);
  }
  return constrainsValue(keyword);
}

/** Whether `options` can disagree about the object's `property`: whether one of them has a keyword that can tell data
 * apart by what it holds there, so an edit to the property may be a choice between them. Undefined is an edit to the
 * object as a whole
 */
export function optionsMayDisagreeAbout<S extends StrictRJSFSchema>(
  options: readonly S[],
  property: string | number | undefined,
): boolean {
  return (
    typeof property !== 'string' ||
    options.some((option) => Object.entries(option).some(([keyword, value]) => keywordReads(keyword, value, property)))
  );
}

function isHeldFor(selection: OptionSelection, data: unknown): boolean {
  return selection.holdsFor.some((held) => deepEquals(held, data));
}

/** A value of the form's data, which a run-time path keeps `unknown`, in the type a field's `onChange` hands over and
 * the schema utilities take it as. The overload is the one trust point that the caller passes what the field at that
 * path holds, the promise a field's own `onChange` makes.
 */
export function asFieldValue<V>(value: unknown): V | undefined;
export function asFieldValue(value: unknown): unknown {
  return value;
}

/** The fields `uiState` shows, as the schema utilities' walks read them: the option each field shows and the cycles
 * the user expanded, and, given the answer, which objects draw their Optional Data Controls beside their options
 *
 * @param uiState - The form's option selections and cycle expansions
 * @param schemaUtils - The schema utilities the form renders with
 * @param [editedPath] - The path of the edit being made, whose field and the fields above it keep their selections, as
 *        they do when the form renders the edit
 * @param [drawsControlsBesideOptions] - Where the form's fields draw the controls, passed in by the caller so this
 *        module needn't import `SchemaField`, which imports it
 * @param [fallbackType] - The type the fallback UI shows at a field it renders, passed in for the same reason
 * @returns - The field state
 */
export function fieldStateOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  uiState: UiStateReader,
  schemaUtils: SchemaUtilsType<T, S, F>,
  editedPath?: FieldPathList,
  drawsControlsBesideOptions?: FormFieldState<S>['drawsControlsBesideOptions'],
  fallbackType?: FormFieldState<S>['fallbackType'],
): FormFieldState<S> {
  const rootSchema = schemaUtils.getRootSchema();
  return {
    ...(drawsControlsBesideOptions && { drawsControlsBesideOptions }),
    ...(fallbackType && { fallbackType }),
    selectedOption: (fieldPath, options, formData, discriminator) =>
      shownOption<T, S, F>(
        schemaUtils,
        uiState.selection(fieldPath, optionListKey<S>(options, rootSchema)),
        options,
        asFieldValue<T>(formData),
        discriminator,
        editedPath !== undefined && isPathPrefix(fieldPathToList(fieldPath), editedPath),
      ),
    isExpanded: (fieldPath) => uiState.isExpanded(fieldPath),
  };
}

/** Whether the form still renders a field at a path for `formData`, shown or hidden. Under an `anyOf`/`oneOf`, the
 * option followed is the one the field shows, the user's pick among them, where `findFieldInSchema()` alone would take
 * the one the data matches best. Each path prefix is walked once, however many of the paths asked about share it
 *
 * @param uiState - The form's option selections and cycle expansions
 * @param schemaUtils - The schema utilities the form renders with
 * @param schema - The retrieved root schema
 * @param formData - The form's data
 * @returns - Whether a field is rendered at a given path
 */
export function fieldsRendered<T, S extends StrictRJSFSchema, F extends FormContextType>(
  uiState: UiStateReader,
  schemaUtils: SchemaUtilsType<T, S, F>,
  schema: S,
  formData: T | undefined,
): (path: FieldPathList) => boolean {
  const fieldState = fieldStateOf<T, S, F>(uiState, schemaUtils);
  // The schema and data found at each path prefix walked
  const reached = new Map<FieldPath, { parent: S | undefined; data: unknown }>();
  return (path) => {
    let parent: S | undefined = schema;
    let data: unknown = formData;
    let at = ROOT_FIELD_PATH;
    for (const key of path) {
      const next = toFieldPath(key, at);
      const known = reached.get(next);
      if (known) {
        ({ parent, data } = known);
      } else if (isSchemaObject<S>(parent)) {
        const fieldData = asFieldValue<T>(data);
        let holder = schemaUtils.retrieveSchema(parent, fieldData);
        const xxxOf = getXxxOfOptions<S>(holder);
        const options = xxxOf && retrievedOptionsOf<T, S, F>(schemaUtils, holder, fieldData);
        if (xxxOf && options) {
          const shown = fieldState.selectedOption(at, options, data, getDiscriminatorFieldFromSchema<S>(holder));
          // The shown option alone, which `findFieldInSchema()` then can't match the data against another for
          holder = { ...holder, [xxxOf.key]: [options[shown]] };
          Reflect.deleteProperty(holder, 'discriminator');
        }
        // A key `additionalProperties: true` lets in is no field to `findFieldInSchema()`, yet the form renders it, from
        // the stub retrieving put in `properties`
        const stub = holder.properties?.[key];
        parent =
          schemaUtils.findFieldInSchema(holder, [key], fieldData).field ?? (isSchemaObject<S>(stub) ? stub : undefined);
        data = getByPath(data, [key]);
        reached.set(next, { parent, data });
      } else {
        return false;
      }
      at = next;
    }
    return parent !== undefined;
  };
}

/** The entries, kept by path, that hold after a move at `container` that `transformChange` rewrote, key by key as
 * `fateOf` says of each: an entry of `moved` under a key holding what the move put there, or outside the container,
 * stays, one of `unmoved`, the entries before the move, under a key holding what it held before comes back, and any
 * other is dropped
 */
export function settledEntries<E>(
  moved: Iterable<E>,
  unmoved: Iterable<E>,
  pathOf: (entry: E) => FieldPath,
  container: FieldPath,
  fateOf: (key: string) => MoveFate,
): E[] {
  const containerSegments = fieldPathToList(container);
  const fateAt = (entry: E) => {
    const segments = fieldPathToList(pathOf(entry));
    return segments.length > containerSegments.length && isPathPrefix(containerSegments, segments)
      ? fateOf(String(segments[containerSegments.length]))
      : 'moved';
  };
  return [
    ...[...moved].filter((entry) => fateAt(entry) === 'moved'),
    ...[...unmoved].filter((entry) => fateAt(entry) === 'unmoved'),
  ];
}

/** Makes each of `selections` hold for the data `dataAt` gives at its field, or for none where the field holds other
 * data, as the form renders that data
 */
function holdForRendered(
  selections: Map<FieldPath, Map<string, OptionSelection>>,
  dataAt: (path: FieldPathList) => unknown,
) {
  for (const [at, lists] of selections) {
    const data = dataAt(fieldPathToList(at));
    for (const [list, selection] of lists) {
      const holdsFor = isHeldFor(selection, data) ? [data] : [];
      if (holdsFor.length !== selection.holdsFor.length || selection.isReleased) {
        lists.set(list, { ...selection, holdsFor, isReleased: false });
      }
    }
  }
}

/** The type a fallback UI's selector was on, and the field that kept it: a token the field holds as long as it lives, so
 * a field mounting at the path later knows the type for another's, which an `<Activity>` hiding the field doesn't end
 */
export interface KeptFallbackType {
  readonly type: JSONSchema7TypeName;
  /** The types the selector offered, so a schema that swaps them for others and back doesn't bring the type back */
  readonly typeList: string;
  readonly owner: object;
}

/** The selections and expansions of a form at one moment, see `save()` */
export interface UiStateSnapshot {
  selections: Map<FieldPath, Map<string, OptionSelection>>;
  fallbackTypes: Map<FieldPath, Map<string, KeptFallbackType>>;
  expanded: Set<FieldPath>;
}

/** `entries` under the paths they take once the keys of the array or object at `container` moved as `newKeyOf` says,
 * without the ones under a key that went
 */
function movedEntries<V>(entries: Map<FieldPath, V>, container: FieldPathList, newKeyOf: KeyMove): Map<FieldPath, V> {
  const moved = new Map<FieldPath, V>();
  for (const [path, value] of entries) {
    const to = movedPath(path, container, newKeyOf);
    if (to !== undefined) {
      moved.set(to, value);
    }
  }
  return moved;
}

/** A copy of `entries` whose inner maps can be written without changing the original's */
function copyOfLists<V>(entries: Map<FieldPath, Map<string, V>>): Map<FieldPath, Map<string, V>> {
  return new Map([...entries].map(([path, lists]) => [path, new Map(lists)]));
}

/** The state of a form that is about what it shows rather than the data: the option selected for each option list, by
 * the path of the field offering it and the list, the type each fallback UI's selector is on, by the same, and which
 * collapsed `$ref` cycles are expanded, by path. It lives as long as the form, so a field that unmounts and mounts
 * again finds its selection, and follows the moves of array items and object keys the form is told of, as the errors
 * do.
 */
export function createUiState() {
  // Read only through the methods below, never handed out, so the maps are written in place
  let selections = new Map<FieldPath, Map<string, OptionSelection>>();
  // The type each fallback UI's selector is on, by its field's path and its depth there: a field's value can offer a
  // type list of its own, whose selector sits at the same path
  let fallbackTypes = new Map<FieldPath, Map<string, KeptFallbackType>>();
  let expanded = new Set<FieldPath>();
  let picks = 0;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const selectionAt = (path: FieldPath, list: string) => selections.get(path)?.get(list);
  const setIn = <V>(entries: Map<FieldPath, Map<string, V>>, path: FieldPath, list: string, value: V) => {
    const lists = entries.get(path);
    if (lists) {
      lists.set(list, value);
    } else {
      entries.set(path, new Map([[list, value]]));
    }
  };
  const setSelection = (path: FieldPath, list: string, selection: OptionSelection) =>
    setIn(selections, path, list, selection);
  /** Records the type the fallback UI's selector showed as React commits, where nothing may render, so it tells no
   * field
   */
  const keepFallbackType = (path: FieldPath, selector: string, kept: KeptFallbackType) =>
    setIn(fallbackTypes, path, selector, kept);
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    selection: selectionAt,
    /** Selects option `index` of `list` at `path`, holding for the data in `holdsFor`: what the form kept for the
     * switch, or nothing where the form's data is to be matched again with the selection preferred
     */
    select: (path: FieldPath, list: string, index: number, holdsFor: readonly unknown[]) => {
      picks += 1;
      setSelection(path, list, { index, pick: picks, holdsFor, isReleased: false });
      notify();
    },
    /** Records the option shown for `data` before an edit inside the field, unless the selection already holds for that
     * data: the edit must not change which option the data is shown under
     */
    keep: (path: FieldPath, list: string, index: number, data: unknown) => {
      const current = selectionAt(path, list);
      if (current === undefined || !isHeldFor(current, data)) {
        setSelection(path, list, { index, pick: current?.pick ?? 0, holdsFor: [data], isReleased: false });
      }
    },
    /** Lets the data an edit to a property of the object's own that the options can disagree about leaves be matched
     * again, as data from outside the field is: the edit may be a choice between them. The data the selection holds for
     * still holds it, so an edit the form refuses leaves the option shown
     */
    release: (path: FieldPath, list: string) => {
      const current = selectionAt(path, list);
      if (current !== undefined && !current.isReleased) {
        setSelection(path, list, { ...current, isReleased: true });
      }
    },
    /** Records, for every selection at or above the edited `path` that holds, the data the edit left there in place of
     * the data before. The data a released edit leaves is left to be matched
     */
    edited: (path: FieldPath, dataAt: (path: FieldPathList) => unknown) => {
      const segments = fieldPathToList(path);
      for (const [at, lists] of selections) {
        const atSegments = fieldPathToList(at);
        if (isPathPrefix(atSegments, segments)) {
          const data = dataAt(atSegments);
          for (const [list, selection] of lists) {
            lists.set(list, heldAfterEdit(selection, data));
          }
        }
      }
    },
    /** Records, for every selection that holds for the data `beforeAt` gives at its field, the data `dataAt` gives there
     * in its place: data the form changed under the options it shows, as omitting extra data changes it
     */
    followed: (beforeAt: (path: FieldPathList) => unknown, dataAt: (path: FieldPathList) => unknown) => {
      for (const [at, lists] of selections) {
        const segments = fieldPathToList(at);
        const before = beforeAt(segments);
        const data = dataAt(segments);
        for (const [list, selection] of lists) {
          if (isHeldFor(selection, before) && !isHeldFor(selection, data)) {
            lists.set(list, { ...selection, holdsFor: [data] });
          }
        }
      }
    },
    /** Records the data the form rendered at each selection's field: the one data the selection holds for from now on,
     * or none where the field showed other data, matched again. Called as React commits, where nothing may render, so
     * it changes no option a field shows for the data it rendered and tells no field
     */
    rendered: (dataAt: (path: FieldPathList) => unknown) => holdForRendered(selections, dataAt),
    /** The type the fallback UI's selector at depth `selector` of `path` was last on, its types and its field */
    fallbackType: (path: FieldPath, selector: string) => fallbackTypes.get(path)?.get(selector),
    /** Puts the fallback UI's selector at depth `selector` of `path` on the type `kept` holds, as the user picked it */
    selectFallbackType: (path: FieldPath, selector: string, kept: KeptFallbackType) => {
      keepFallbackType(path, selector, kept);
      notify();
    },
    keepFallbackType,
    /** Forgets the fallback UI types kept at the paths `isGone` says no field reaches any more, so a field the schema
     * brings back starts on the type its data starts it on for the readers that walk it before it renders. A field an
     * `<Activity>` hides is still reached, so it keeps its type
     */
    dropFallbackTypes: (isGone: (path: FieldPathList) => boolean) => {
      for (const at of fallbackTypes.keys()) {
        if (isGone(fieldPathToList(at))) {
          fallbackTypes.delete(at);
        }
      }
    },
    isExpanded: (path: FieldPath) => expanded.has(path),
    expand: (path: FieldPath) => {
      expanded.add(path);
      notify();
    },
    /** The selections, fallback UI types and expansions as they are, for `restore()` to put back */
    save: (): UiStateSnapshot => ({
      selections: copyOfLists(selections),
      fallbackTypes: copyOfLists(fallbackTypes),
      expanded: new Set(expanded),
    }),
    /** Puts back what `save()` returned, as a change the form refused leaves it */
    restore: (snapshot: UiStateSnapshot) => {
      ({ selections, fallbackTypes, expanded } = snapshot);
      notify();
    },
    /** Settles a move at `container` that `transformChange` rewrote, key by key, as `fateOf` says of each: one the
     * form holds the moved item under keeps the moved state, one holding the item it held before the move takes back
     * the state from before, `unmoved`, and any other key loses its state, so its data is matched again
     */
    settleMove: (container: FieldPath, unmoved: UiStateSnapshot, fateOf: (key: string) => MoveFate) => {
      selections = new Map(settledEntries(selections, unmoved.selections, ([path]) => path, container, fateOf));
      fallbackTypes = new Map(
        settledEntries(fallbackTypes, unmoved.fallbackTypes, ([path]) => path, container, fateOf),
      );
      expanded = new Set(settledEntries(expanded, unmoved.expanded, (path) => path, container, fateOf));
      notify();
    },
    /** Moves the selections, fallback types and expansions under the array or object at `container` as its keys did */
    move: (container: FieldPath, newKeyOf: KeyMove) => {
      const containerSegments = fieldPathToList(container);
      selections = movedEntries(selections, containerSegments, newKeyOf);
      fallbackTypes = movedEntries(fallbackTypes, containerSegments, newKeyOf);
      expanded = movedPaths(expanded, containerSegments, newKeyOf);
      notify();
    },
  };
}

export type UiState = ReturnType<typeof createUiState>;

/** What deriving data reads of a `UiState`: the option selected for a list, and whether a cycle is expanded */
export type UiStateReader = Pick<UiState, 'selection' | 'isExpanded'>;

/** `uiState` with no option selected, for the baseline the form mounted with: it was derived when the form showed the
 * options its own data matched, so the options the user picked since are the edited data's, not the baseline's
 */
export function withoutSelections(uiState: UiState): UiStateReader {
  return { selection: () => undefined, isExpanded: uiState.isExpanded };
}

/** `baselineUiState` with the selections of `uiState` that hold for the baseline's data at their field in place of its
 * own, for re-deriving the baseline: where the data the form shows is the baseline's, the baseline takes the option the
 * form shows it under, as the baseline of a clean form does
 *
 * @param uiState - The form's option selections and cycle expansions
 * @param baselineUiState - The selections the baseline was derived under
 * @param dataAt - The baseline's data at a field's path
 * @returns - The selections to re-derive the baseline under
 */
export function withSelectionsHeldFor(
  uiState: UiState,
  baselineUiState: UiStateReader,
  dataAt: (path: FieldPathList) => unknown,
): UiStateReader {
  return {
    selection: (path, list) => {
      const selection = uiState.selection(path, list);
      return selection && isHeldFor(selection, dataAt(fieldPathToList(path)))
        ? selection
        : baselineUiState.selection(path, list);
    },
    isExpanded: baselineUiState.isExpanded,
  };
}

/** The JSON copy of `data` the validator is handed: keys holding `undefined` dropped, array items holding it `null` */
export function jsonCopyOf(data: unknown): unknown {
  const serialized = JSON.stringify(data);
  return serialized === undefined ? undefined : JSON.parse(serialized);
}

/** `uiState` with each selection that holds for the data the form shows at its field holding for the validated copy of
 * that data as well, for matching the copy the validator is handed. A selection the data no longer holds is matched
 * again, as the render matches it, even where the data's copy equals the copy of the data it held for
 *
 * @param uiState - The form's option selections and cycle expansions
 * @param dataAt - The data the form shows at a field's path
 * @param copiesAt - The validated data at a field's path, with extra data omitted on a submit, `validateForm()` or a
 *        `liveOmit: 'onBlur'` blur that asks for it, which the ui:required walk reads, and its JSON copy, which writes an
 *        array item holding `undefined` as the `null` a copy of the item alone would not
 * @returns - The selections, each holding for its data and, where that is the form's, its validated copies
 */
export function withSelectionsHeldForValidated(
  uiState: UiStateReader,
  dataAt: (path: FieldPathList) => unknown,
  copiesAt: (path: FieldPathList) => readonly unknown[],
): UiStateReader {
  return {
    selection: (path, list) => {
      const selection = uiState.selection(path, list);
      if (selection === undefined) {
        return undefined;
      }
      const at = fieldPathToList(path);
      return isHeldFor(selection, dataAt(at))
        ? { ...selection, holdsFor: [...selection.holdsFor, ...copiesAt(at)] }
        : selection;
    },
    isExpanded: uiState.isExpanded,
  };
}

/** `uiState` with the options selected now and never the ones picked later, for the baseline `reset()` derives under
 * the options the form shows at the reset. Each holds for the reset's data, as once the form renders it, so the snapshot
 * keeps none of the data from before the reset
 *
 * @param uiState - The form's option selections and cycle expansions
 * @param dataAt - The reset's data at a field's path
 * @returns - The selections as of now, for the baseline
 */
export function withSelectionsAsOf(uiState: UiState, dataAt: (path: FieldPathList) => unknown): UiStateReader {
  const { selections } = uiState.save();
  holdForRendered(selections, dataAt);
  return { selection: (path, list) => selections.get(path)?.get(list), isExpanded: uiState.isExpanded };
}
