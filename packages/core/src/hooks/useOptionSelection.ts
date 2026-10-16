import { use, useCallback, useInsertionEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { FieldPath, FormContextType, Registry, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import ShownOptionContext from '../components/fields/ShownOptionContext.ts';
import type { UiState } from '../components/uiState.ts';
import { optionListKey, optionsMayDisagreeAbout, shownOption } from '../components/uiState.ts';
import useUiState from './useUiState.ts';

/** The option an `anyOf`/`oneOf` field shows, and how to select another */
export interface OptionSelectionState {
  /** The index of the option shown, -1 when there are no options */
  selectedOption: number;
  /** Selects the option at `index`. It does not change the data: the field sends the data for the new option itself */
  selectOption: (index: number) => void;
}

/** `OptionSelectionState`, and what `SchemaField` calls before an edit inside the field */
interface ShownOptionState extends OptionSelectionState {
  /** Records the option shown before an edit inside the option, so the edit cannot change which option it is shown
   * under
   */
  keepSelection: () => void;
  /** Called before an edit to `property` of the object's own, beside its options: where the options can disagree about
   * it, such as through a `const` or a `required` naming it or a keyword reading the object whole like
   * `minProperties`, the data the edit leaves is matched again, as data from outside the field is; otherwise the option
   * shown is kept, as for an edit inside it
   */
  editOwnProperty: (property: string | number | undefined) => void;
}

const noSubscription = () => () => undefined;

/** `useOptionSelection()` with `keepSelection()` and `editOwnProperty()`, which `SchemaField` calls from the
 * `onChange` it hands the option and the field's own children
 */
export function useShownOption<T, S extends StrictRJSFSchema, F extends FormContextType>(
  uiState: UiState,
  registry: Registry<T, S, F>,
  fieldPath: FieldPath,
  options: readonly S[] | undefined,
  formData: T | undefined,
  discriminatorField?: string,
): ShownOptionState {
  const { schemaUtils } = registry;
  const rootSchema = schemaUtils.getRootSchema();
  const list = useMemo(() => options && optionListKey<S>(options, rootSchema), [options, rootSchema]);
  // Only the pick is subscribed to: the data a selection holds for changes as the form commits, without changing the
  // option shown for the data rendered, and a snapshot that changed in the commit would have the field render again
  const readPick = () => (list === undefined ? undefined : uiState.selection(fieldPath, list)?.pick);
  const pick = useSyncExternalStore(list === undefined ? noSubscription : uiState.subscribe, readPick, readPick);
  const selectedOption = useMemo(() => {
    if (!options) {
      return -1;
    }
    const selection = list === undefined || pick === undefined ? undefined : uiState.selection(fieldPath, list);
    return shownOption<T, S, F>(schemaUtils, selection, options, formData, discriminatorField);
  }, [options, list, pick, uiState, fieldPath, formData, schemaUtils, discriminatorField]);
  // What the last committed render showed, which the handlers record: they run after it, and read it rather than close
  // over it so that a field's children keep the handlers they were given while the data changes
  const shown = useRef({ index: selectedOption, data: formData, options });
  useInsertionEffect(() => {
    shown.current = { index: selectedOption, data: formData, options };
  }, [selectedOption, formData, options]);
  const selectOption = useCallback(
    (index: number) => {
      if (list !== undefined) {
        uiState.select(fieldPath, list, index, shown.current.data);
      }
    },
    [list, uiState, fieldPath],
  );
  const keepSelection = useCallback(() => {
    if (list !== undefined) {
      uiState.keep(fieldPath, list, shown.current.index, shown.current.data);
    }
  }, [list, uiState, fieldPath]);
  const editOwnProperty = useCallback(
    (property: string | number | undefined) => {
      const { options: shownOptions } = shown.current;
      if (shownOptions && optionsMayDisagreeAbout<S>(shownOptions, property)) {
        if (list !== undefined) {
          uiState.release(fieldPath, list);
        }
      } else {
        keepSelection();
      }
    },
    [list, uiState, fieldPath, keepSelection],
  );
  return useMemo(
    () => ({ selectedOption, selectOption, keepSelection, editOwnProperty }),
    [selectedOption, selectOption, keepSelection, editOwnProperty],
  );
}

/** Reads and writes the option selected for the `anyOf`/`oneOf` options of the field at `fieldPath`. The selection is
 * the form's state, kept by the path of the field and the option list (the list's place in the root schema), so it
 * outlives the field's components and follows the array moves the form is told of, and a condition that swaps the list
 * the field offers starts the choice over. `SchemaField` reads it to stub the extra keys of the data once, with the
 * selected option, and `AnyOfField`/`OneOfField` read and write it, as a custom field rendering the options has to.
 *
 * With no selection, the option is the one `getClosestMatchingOption()` picks for the data, an option whose discriminator
 * holds the data's value first. A selection holds for the data the form last rendered under it and the data the
 * form's own changes leave at the field, so neither an edit inside the option, an edit to a property of the object's
 * own that the options cannot disagree about, nor a parent declining a switch or an edit changes it. Other data, such
 * as a parent's new `formData`, a reset, a parent answering a switch with data of its own, or an edit to a property of
 * the object's own that they can disagree about, is matched again, with the selection preferred where it fits the data
 * as well as any other option, and so is the data after it until the user switches or makes an edit that holds the
 * option then shown. Data holding a value for the declared discriminator is always matched, so an edit to the
 * discriminator switches.
 *
 * Outside a `Form` the selection is kept by the outermost `SchemaField`, or the calling component when there is none,
 * and nothing records the data a switch or an edit leaves, so the data rendered after one counts as arriving from
 * outside.
 *
 * @param registry - The `registry` of the field
 * @param fieldPath - The path of the field offering the options
 * @param options - The field's options, each retrieved for its data as `SchemaField` retrieves them, if it offers any
 * @param formData - The field's data
 * @param [discriminatorField] - The property the options are told apart by, if any
 * @returns - The option shown and the function that selects one
 */
export default function useOptionSelection<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  registry: Registry<T, S, F>,
  fieldPath: FieldPath,
  options: readonly S[] | undefined,
  formData: T | undefined,
  discriminatorField?: string,
): OptionSelectionState {
  const shown = use(ShownOptionContext);
  // `SchemaField` has already worked out the option it shows from these very options, so `AnyOfField` reads it there
  const above = shown?.fieldPath === fieldPath && shown.options === options ? shown : undefined;
  const own = useShownOption<T, S, F>(
    useUiState().uiState,
    registry,
    fieldPath,
    above ? undefined : options,
    formData,
    discriminatorField,
  );
  const { selectedOption, selectOption } = above ?? own;
  return useMemo(() => ({ selectedOption, selectOption }), [selectedOption, selectOption]);
}
