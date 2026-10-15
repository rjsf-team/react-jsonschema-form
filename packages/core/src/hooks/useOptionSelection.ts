import { useCallback, useInsertionEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import type { FieldPath, FormContextType, Registry, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';

import type { UiState } from '../components/uiState.ts';
import { optionListKey, shownOption } from '../components/uiState.ts';
import useUiState from './useUiState.ts';

/** The option an `anyOf`/`oneOf` field shows, and how to select another */
export interface OptionSelectionState {
  /** The index of the option shown, -1 when there are no options */
  selectedOption: number;
  /** Selects the option at `index`. It does not change the data: the field sends the data for the new option itself */
  selectOption: (index: number) => void;
}

/** `OptionSelectionState`, and what `SchemaField` calls before an edit inside the field */
export interface ShownOptionState extends OptionSelectionState {
  /** Records the option shown before an edit inside the option, so the edit cannot change which option it is shown
   * under
   */
  keepSelection: () => void;
  /** Lets the data an edit to the object's own properties leaves be matched again, as data from outside the field is */
  releaseSelection: () => void;
}

const noSubscription = () => () => undefined;

/** `useOptionSelection()` with `keepSelection()` and `releaseSelection()`, which `SchemaField` calls from the
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
  // Only the index is subscribed to: the data a selection holds for changes as the form commits, without changing the
  // option shown for the data rendered, and a snapshot that changed in the commit would have the field render again
  const readIndex = () => (list === undefined ? undefined : uiState.selection(fieldPath, list)?.index);
  const storedIndex = useSyncExternalStore(
    list === undefined ? noSubscription : uiState.subscribe,
    readIndex,
    readIndex,
  );
  const selectedOption = useMemo(() => {
    if (!options) {
      return -1;
    }
    const selection = list === undefined || storedIndex === undefined ? undefined : uiState.selection(fieldPath, list);
    return shownOption<T, S, F>(schemaUtils, selection, options, formData, discriminatorField);
  }, [options, list, storedIndex, uiState, fieldPath, formData, schemaUtils, discriminatorField]);
  // What the last committed render showed, which the handlers record: they run after it, and read it rather than close
  // over it so that a field's children keep the handlers they were given while the data changes
  const shown = useRef({ index: selectedOption, data: formData });
  useInsertionEffect(() => {
    shown.current = { index: selectedOption, data: formData };
  }, [selectedOption, formData]);
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
  const releaseSelection = useCallback(() => {
    if (list !== undefined) {
      uiState.release(fieldPath, list);
    }
  }, [list, uiState, fieldPath]);
  return useMemo(
    () => ({ selectedOption, selectOption, keepSelection, releaseSelection }),
    [selectedOption, selectOption, keepSelection, releaseSelection],
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
 * form's own changes leave at the field, so neither an edit inside the option nor a parent declining a switch or an
 * edit changes it. Other data, such as a parent's new `formData`, a reset, a parent answering a switch with data of its
 * own, or an edit to the object's own properties, is matched again, with the selection preferred where it fits the data
 * as well as any other option, and so is the data after it until the user switches or edits inside the option, which
 * holds the option then shown. Data holding a value for the declared discriminator is always matched, so an edit to the
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
  const { uiState } = useUiState();
  const { selectedOption, selectOption } = useShownOption<T, S, F>(
    uiState,
    registry,
    fieldPath,
    options,
    formData,
    discriminatorField,
  );
  return useMemo(() => ({ selectedOption, selectOption }), [selectedOption, selectOption]);
}
