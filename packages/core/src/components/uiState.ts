import type {
  FieldPath,
  FieldPathList,
  FormContextType,
  FormFieldState,
  SchemaUtilsType,
  StrictRJSFSchema,
} from '@rjsf/utils';
import { deepEquals, fieldPathFromList, fieldPathToList, getValidationTarget } from '@rjsf/utils';

import type { KeyMove } from './formState.ts';

/** The option selected for a field's option list, with the field's data as the form last left it there: data that
 * differs arrived from outside the field, see `useOptionSelection()`
 */
export interface OptionSelection {
  readonly index: number;
  readonly data: unknown;
}

/** The key a field's option list is stored under: the options' places in the root schema, so a condition that swaps
 * the list the field offers starts the choice over, and finds the old one again when it swaps back
 *
 * @param options - The options, each retrieved for the field's data
 * @param rootSchema - The root schema
 * @returns - The key
 */
export function optionListKey<S extends StrictRJSFSchema>(options: readonly S[], rootSchema: S): string {
  return options
    .map((option) => {
      const ref = getValidationTarget<S>(option, rootSchema).$ref;
      return typeof ref === 'string' ? ref : '';
    })
    .join('\n');
}

/** The option a field shows for `formData`. With no `selection`, the option `getClosestMatchingOption()` picks. A
 * selection holds while `formData` is the data the form last left at the field, or `holds` says an edit inside the
 * field is being made; other data arrived from outside the field, and keeps the selection while it validates against
 * the option, and is matched again otherwise.
 *
 * @param schemaUtils - The schema utilities to match and validate with
 * @param selection - The stored selection, if any
 * @param options - The options, each retrieved for `formData`
 * @param formData - The field's data
 * @param [discriminator] - The property the options are told apart by, if any
 * @param [holds=false] - Whether an edit inside the field is being made, which keeps the selection whatever the data
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
  const matched = (preferred: number) =>
    schemaUtils.getClosestMatchingOption(formData, [...options], preferred, discriminator);
  if (selection === undefined || selection.index >= options.length) {
    return matched(-1);
  }
  const { index, data } = selection;
  if (holds || Object.is(data, formData) || deepEquals(data, formData)) {
    return index;
  }
  const rootSchema = schemaUtils.getRootSchema();
  const isValid = schemaUtils
    .getValidator()
    .isValid(getValidationTarget<S>(options[index], rootSchema), formData, rootSchema);
  return isValid ? index : matched(index);
}

/** A value of the form's data, in the type the schema utilities take it as */
export function dataOf<T>(value: unknown): T | undefined;
export function dataOf(value: unknown): unknown {
  return value;
}

/** The fields `uiState` shows, as the schema utilities' walks read them: the option each field shows and the cycles
 * the user expanded
 *
 * @param uiState - The form's option selections and cycle expansions
 * @param schemaUtils - The schema utilities the form renders with
 * @returns - The field state
 */
export function fieldStateOf<T, S extends StrictRJSFSchema, F extends FormContextType>(
  uiState: UiState,
  schemaUtils: SchemaUtilsType<T, S, F>,
): FormFieldState<S> {
  const rootSchema = schemaUtils.getRootSchema();
  return {
    selectedOption: (fieldPath, options, formData, discriminator) =>
      shownOption<T, S, F>(
        schemaUtils,
        uiState.selection(fieldPath, optionListKey<S>(options, rootSchema)),
        options,
        dataOf<T>(formData),
        discriminator,
      ),
    isExpanded: (fieldPath) => uiState.isExpanded(fieldPath),
  };
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
