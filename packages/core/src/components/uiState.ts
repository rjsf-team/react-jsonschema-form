import type {
  FieldPath,
  FieldPathList,
  FormContextType,
  FormFieldState,
  SchemaUtilsType,
  StrictRJSFSchema,
} from '@rjsf/utils';
import {
  deepEquals,
  fieldPathFromList,
  fieldPathToList,
  getByPath,
  getValidationTarget,
  getXxxOfKey,
  isConstantOptionList,
  isObject,
  isSchemaObject,
  PROPERTIES_KEY,
  REQUIRED_KEY,
} from '@rjsf/utils';

import type { KeyMove } from './formState.ts';

/** The option selected for a field's option list, and the field's data it holds for, see `useOptionSelection()` */
export interface OptionSelection {
  readonly index: number;
  /** Which pick of the user's the selection was made by, unique within the form: a field observes every pick by it,
   * since picking the selected option again shows it where the data showed another
   */
  readonly pick: number;
  /** The field's data as the form last rendered it under the selection, and the data each change the form proposed
   * since leaves there: a parent answers a proposal with one of them, the proposal or, declining it, the data before.
   * Empty once the form rendered other data, which the selection is then only the preference in matching
   */
  readonly holdsFor: readonly unknown[];
  /** Whether an edit to a property of the object's own that the options can disagree about was made since the form
   * last rendered: the data it leaves is matched again, while the data in `holdsFor` still holds the selection, so a
   * parent declining the edit leaves the option shown
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
function heldAfterEdit(selection: OptionSelection, data: unknown, isProposal: boolean): OptionSelection {
  if (selection.holdsFor.length === 0 || selection.isReleased) {
    return selection;
  }
  return { ...selection, holdsFor: isProposal ? [...selection.holdsFor, data] : [data] };
}

/** A `true` option is any value, which a field renders as the empty schema */
function emptySchema<S extends StrictRJSFSchema>(): S;
function emptySchema(): StrictRJSFSchema {
  return {};
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
  const xxxOfKey = getXxxOfKey<S>(view);
  const list = xxxOfKey ? view[xxxOfKey] : undefined;
  if (!list || isConstantOptionList<S>(list, true)) {
    return undefined;
  }
  return list.map((option) =>
    schemaUtils.retrieveSchema(isSchemaObject<S>(option) ? option : emptySchema<S>(), formData),
  );
}

/** The keywords of an option that cannot tell apart data that differs at one property: the annotations, which
 * validate nothing, and `type`, since an edit to a property leaves the data the object it was
 */
const KEYWORDS_READING_NO_PROPERTY = new Set([
  '$comment',
  '$id',
  '$schema',
  'default',
  'deprecated',
  'description',
  'examples',
  'readOnly',
  'title',
  'type',
  'writeOnly',
]);

/** Whether `keyword` of an option, with `value`, can tell data apart by what it holds at `property`. `properties` and
 * `required` can only where they name the property; any other keyword that validates, such as `minProperties` or
 * `not`, reads the object whole
 */
function keywordReads(keyword: string, value: unknown, property: string): boolean {
  if (keyword === PROPERTIES_KEY) {
    return !isObject(value) || Object.hasOwn(value, property);
  }
  if (keyword === REQUIRED_KEY) {
    return !Array.isArray(value) || value.includes(property);
  }
  return !KEYWORDS_READING_NO_PROPERTY.has(keyword);
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
 * the user expanded
 *
 * @param uiState - The form's option selections and cycle expansions
 * @param schemaUtils - The schema utilities the form renders with
 * @param [editedPath] - The path of the edit being made, whose field and the fields above it keep their selections, as
 *        they do when the form renders the edit
 * @returns - The field state
 */
export function fieldStateOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  uiState: UiState,
  schemaUtils: SchemaUtilsType<T, S, F>,
  editedPath?: FieldPathList,
): FormFieldState<S> {
  const rootSchema = schemaUtils.getRootSchema();
  return {
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

/** The new path of `path` once the keys of the array or object at `container` moved as `newKeyOf` says, undefined for
 * one under a key that went, and `path` itself for one outside `container`
 */
function movedPath(path: FieldPath, container: FieldPathList, newKeyOf: KeyMove): FieldPath | undefined {
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

/** Whether `prefix` addresses `path` itself or a container holding it, comparing the segments the way `toPath()` spells
 * them, so a numeric array index and its string form are the same segment
 *
 * @param prefix - The path that may lead into `path`
 * @param path - The path being addressed
 * @returns - True when every segment of `prefix` opens `path`
 */
export function isPathPrefix(prefix: FieldPathList, path: FieldPathList): boolean {
  return prefix.length <= path.length && prefix.every((segment, i) => String(segment) === String(path[i]));
}

/** The state of a form that is about what it shows rather than the data: the option selected for each option list, by
 * the path of the field offering it and the list, and which collapsed `$ref` cycles are expanded, by path. It lives as
 * long as the form, so a field that unmounts and mounts again finds its selection, and follows the moves of array items
 * and object keys the form is told of, as the errors do.
 */
export function createUiState() {
  // Read only through the methods below, never handed out, so the maps are written in place
  let selections = new Map<FieldPath, Map<string, OptionSelection>>();
  let expanded = new Set<FieldPath>();
  let picks = 0;
  const listeners = new Set<() => void>();
  const notify = () => listeners.forEach((listener) => listener());
  const selectionAt = (path: FieldPath, list: string) => selections.get(path)?.get(list);
  const setSelection = (path: FieldPath, list: string, selection: OptionSelection) => {
    const lists = selections.get(path);
    if (lists) {
      lists.set(list, selection);
    } else {
      selections.set(path, new Map([[list, selection]]));
    }
  };
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    selection: selectionAt,
    /** Selects option `index` of `list` at `path` for the field's `data` as it is shown */
    select: (path: FieldPath, list: string, index: number, data: unknown) => {
      picks += 1;
      setSelection(path, list, { index, pick: picks, holdsFor: [data], isReleased: false });
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
     * still holds it, so a parent declining the edit leaves the option shown
     */
    release: (path: FieldPath, list: string) => {
      const current = selectionAt(path, list);
      if (current !== undefined && !current.isReleased) {
        setSelection(path, list, { ...current, isReleased: true });
      }
    },
    /** Records, for every selection at or above the edited `path` that holds, the data the edit left there: in place of
     * the data before, unless the edit is a proposal the parent may decline. The data a released edit leaves is left to
     * be matched
     */
    edited: (path: FieldPath, dataAt: (path: FieldPathList) => unknown, isProposal: boolean) => {
      const segments = fieldPathToList(path);
      for (const [at, lists] of selections) {
        const atSegments = fieldPathToList(at);
        if (isPathPrefix(atSegments, segments)) {
          const data = dataAt(atSegments);
          for (const [list, selection] of lists) {
            lists.set(list, heldAfterEdit(selection, data, isProposal));
          }
        }
      }
    },
    /** Records the data the form rendered at each selection's field: the one data the selection holds for from now on,
     * or none where the field showed other data, matched again. It changes no option shown, so nothing is notified
     */
    rendered: (dataAt: (path: FieldPathList) => unknown) => {
      for (const [at, lists] of selections) {
        const data = dataAt(fieldPathToList(at));
        for (const [list, selection] of lists) {
          const holdsFor = isHeldFor(selection, data) ? [data] : [];
          if (holdsFor.length !== selection.holdsFor.length || selection.isReleased) {
            lists.set(list, { ...selection, holdsFor, isReleased: false });
          }
        }
      }
    },
    isExpanded: (path: FieldPath) => expanded.has(path),
    expand: (path: FieldPath) => {
      expanded.add(path);
      notify();
    },
    /** Moves the selections and expansions under the array or object at `container` as its keys moved */
    move: (container: FieldPath, newKeyOf: KeyMove) => {
      const containerSegments = fieldPathToList(container);
      const movedSelections = new Map<FieldPath, Map<string, OptionSelection>>();
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
  };
}

export type UiState = ReturnType<typeof createUiState>;
