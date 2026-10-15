import { use, useCallback, useInsertionEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { FieldPath, FormContextType, Registry, RJSFSchema, StrictRJSFSchema } from '@rjsf/utils';
import { deepEquals, getValidationTarget } from '@rjsf/utils';

import FormDataContext from '../components/FormDataContext.ts';
import type { OptionSelection } from '../components/uiState.ts';

/** The option an `anyOf`/`oneOf` field shows, and how to select another */
export interface OptionSelectionState {
  /** The index of the option shown, -1 when there are no options */
  selectedOption: number;
  /** Selects the option at `index`. It does not change the data: the field sends the data for the new option itself */
  selectOption: (index: number) => void;
  /** Records the option shown before an edit inside the field, so the edit cannot change which option it is shown
   * under. `SchemaField` calls it from the `onChange` it hands the field's children
   */
  keepSelection: () => void;
}

const noSubscription = () => () => undefined;

/** The data a selection outside a `Form` records for an option switch, which equals no data */
const PROPOSED = Symbol('proposed');

/** Reads and writes the option selected for the `anyOf`/`oneOf` options of the field at `fieldPath`. The selection is
 * the form's state, kept by the path of the field and the option list (the options' places in the root schema), so it
 * outlives the field's components and follows the array moves the form is told of, and a condition that swaps the list
 * the field offers starts the choice over. `SchemaField` reads it to stub the extra keys of the data once, with the
 * selected option, and `AnyOfField`/`OneOfField` read and write it, as a custom field rendering the options has to.
 *
 * With no selection, the option is the one `getClosestMatchingOption()` picks for the data, an option whose discriminator
 * holds the data's value first. A selection holds while the data is the data the form left at the field, whatever the
 * edits inside the field made of it. Data that arrives from outside the field, such as a parent's new `formData` or a
 * parent declining the data an option switch proposed, keeps the selection while it validates against the option, and
 * is matched again otherwise.
 *
 * Outside a `Form` the selection is the calling component's own state, and the data rendered after a switch counts as
 * arriving from outside.
 *
 * @param registry - The `registry` of the field
 * @param fieldPath - The path of the field offering the options
 * @param options - The field's options, each retrieved for its data as `SchemaField` retrieves them, if it offers any
 * @param formData - The field's data
 * @param [discriminatorField] - The property the options are told apart by, if any
 * @returns - The option shown and the functions that select one
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
  const uiState = use(FormDataContext)?.uiState;
  const { schemaUtils } = registry;
  const rootSchema = schemaUtils.getRootSchema();
  const list = useMemo(
    () =>
      options
        ?.map((option) => {
          const ref = getValidationTarget<S>(option, rootSchema).$ref;
          return typeof ref === 'string' ? ref : '';
        })
        .join('\n'),
    [options, rootSchema],
  );
  const [local, setLocal] = useState<{ list: string; selection: OptionSelection } | undefined>(undefined);
  const readStored = () => (uiState && list !== undefined ? uiState.selection(fieldPath, list) : undefined);
  const stored = useSyncExternalStore(uiState?.subscribe ?? noSubscription, readStored, readStored);
  const localSelection = local !== undefined && local.list === list ? local.selection : undefined;
  const selection = uiState ? stored : localSelection;
  const selectedOption = useMemo(() => {
    if (!options || options.length === 0) {
      return -1;
    }
    const matched = (preferred: number) =>
      schemaUtils.getClosestMatchingOption(formData, [...options], preferred, discriminatorField);
    if (selection === undefined || selection.index >= options.length) {
      return matched(-1);
    }
    const { index, data } = selection;
    if (Object.is(data, formData) || deepEquals(data, formData)) {
      return index;
    }
    const isValid = schemaUtils
      .getValidator()
      .isValid(getValidationTarget<S>(options[index], rootSchema), formData, rootSchema);
    return isValid ? index : matched(index);
  }, [options, selection, formData, schemaUtils, discriminatorField, rootSchema]);
  // What the last committed render showed, which the handlers record: they run after it, and read it rather than close
  // over it so that a field's children keep the handlers they were given while the data changes
  const shown = useRef({ index: selectedOption, data: formData });
  useInsertionEffect(() => {
    shown.current = { index: selectedOption, data: formData };
  }, [selectedOption, formData]);
  const write = useCallback(
    (index: number | undefined, keep: boolean) => {
      if (list === undefined) {
        return;
      }
      const { data } = shown.current;
      const selected = index ?? shown.current.index;
      if (!uiState) {
        // Outside a form nothing records the data a switch proposes, so whatever data comes next counts as arriving
        // from outside
        setLocal((current) =>
          keep && current?.list === list && deepEquals(current.selection.data, data)
            ? current
            : { list, selection: { index: selected, data: keep ? data : PROPOSED } },
        );
      } else if (keep) {
        uiState.keep(fieldPath, list, selected, data);
      } else {
        uiState.select(fieldPath, list, selected, data);
      }
    },
    [list, uiState, fieldPath],
  );
  const selectOption = useCallback((index: number) => write(index, false), [write]);
  const keepSelection = useCallback(() => write(undefined, true), [write]);
  return useMemo(
    () => ({ selectedOption, selectOption, keepSelection }),
    [selectedOption, selectOption, keepSelection],
  );
}
