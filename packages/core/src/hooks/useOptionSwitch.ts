import { useCallback, useMemo } from 'react';
import type {
  FieldPath,
  FieldProps,
  FormContextType,
  GenericObjectType,
  RJSFSchema,
  StrictRJSFSchema,
  UiSchema,
} from '@rjsf/utils';
import {
  getDiscriminatorFieldFromSchema,
  isPlainObject,
  logOnce,
  selectOptionUiSchema,
  setByPath,
  toFieldPath,
} from '@rjsf/utils';

import { optionsKeywordOf } from '../components/fields/fieldWidgetUtils.ts';
import formDataForNewOption from '../components/fields/formDataForNewOption.ts';
import type { OptionSwitchData } from '../components/fields/formDataForNewOption.ts';
import { asFieldValue } from '../components/uiState.ts';
import fieldLabelForLog from '../fieldLabelForLog.ts';
import useOptionSelection from './useOptionSelection.ts';
import useSendOptionSwitch, { holdsOnlyNull, selectSwitchedOption } from './useSendOptionSwitch.ts';

/** The props of a field `useOptionSwitch()` reads */
export type OptionSwitchFieldProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Pick<FieldProps<T, S, F>, 'schema' | 'uiSchema' | 'fieldPath' | 'formData' | 'onChange' | 'registry' | 'id'> &
  Partial<Pick<FieldProps<T, S, F>, 'disabled' | 'readonly'>>;

/** The option an `anyOf`/`oneOf` field shows, and how to switch to another */
export interface OptionSwitchState<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> {
  /** The index of the option shown, -1 when there are no options */
  selectedOption: number;
  /** The uiSchema of each option, as the field's `uiSchema` lists them under its `anyOf`/`oneOf`, empty where it lists
   * none. An option past the end of the list renders with the field's own `uiSchema`
   */
  optionsUiSchema: UiSchema<T, S, F>[];
  /** Switches the field to the option at `index`, or clears the selection for an `index` below 0. The field sends what
   * it holds that the option can hold, filled with what the option starts from, and the form it is rendered in puts
   * back each key the data held and judges it against the option switched away from: it replaces what the old
   * option's defaults filled in and drops what the new option has no field for. Does nothing for a `disabled` or
   * `readonly` field, or for the option already shown.
   *
   * A field that writes values of its own on a switch, such as the property its selector edits, passes them as
   * `ownValues`, by their path in the field's object: each is written into the object the field sends for an option
   * that holds one, and kept as written rather than judged. The switch is then sent for the option already shown too,
   * since the data may not hold those values yet
   */
  switchOption: (index: number, ownValues?: GenericObjectType) => void;
}

/** `switched` with `ownValues` written into the object it sends, each at its path. Each is the field's own write, so
 * the form keeps it rather than putting back what the data held there. Data that is no object takes none
 *
 * @param switched - What the switch sends, with the keys the data held before it
 * @param ownValues - The values the field writes itself, by their key in the field's object
 * @param fieldPath - The path of the field
 * @returns - What the switch sends with the field's own values
 */
function withOwnValues<T>(
  switched: OptionSwitchData<T>,
  ownValues: GenericObjectType,
  fieldPath: FieldPath,
): OptionSwitchData<T> {
  const { formData, held } = switched;
  if (!isPlainObject(formData)) {
    return switched;
  }
  const written: GenericObjectType = { ...formData };
  Object.entries(ownValues).forEach(([path, value]) => setByPath(written, path, value));
  const keep = held && Object.entries(held).filter(([key]) => !Object.hasOwn(ownValues, key));
  return {
    formData: asFieldValue<T>(written),
    held: keep && Object.fromEntries(keep),
    written: Object.keys(ownValues).map((key) => toFieldPath(key, fieldPath)),
  };
}

/** Shows and switches the option of an `anyOf`/`oneOf` field, as `AnyOfField` and `OneOfField` do. A custom field that
 * renders its own option selector calls it with its props and its options, shows `selectedOption`, and calls
 * `switchOption()` when the user picks another: the selection and the data change together, through the form.
 *
 * Outside a `Form` the field's own judgement of the switch stands: what the option switched to cannot hold is dropped,
 * as `sanitizeDataForNewSchema()` drops it, and what it declares is filled.
 *
 * @param props - The field's props
 * @param options - The field's options, each retrieved for its data as `SchemaField` retrieves them
 * @param [selectorId=props.id] - The id of the control that switches, which `onChange` is told the change came from
 * @returns - The option shown, the uiSchema of each option and the function that switches to another
 */
export default function useOptionSwitch<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: OptionSwitchFieldProps<T, S, F>, options: readonly S[], selectorId?: string): OptionSwitchState<T, S, F> {
  const { schema, uiSchema, fieldPath, formData, onChange, registry, id, disabled = false, readonly = false } = props;
  const { schemaUtils, uiSchemaDefinitions, globalUiOptions } = registry;
  const changedId = selectorId ?? id;
  const sendOptionSwitch = useSendOptionSwitch(fieldPath);
  const { selectedOption, selectOption } = useOptionSelection<T, S, F>(
    registry,
    fieldPath,
    options,
    formData,
    getDiscriminatorFieldFromSchema<S>(schema),
  );
  const optionsUiSchema = useMemo<UiSchema<T, S, F>[]>(() => {
    const keyword = optionsKeywordOf<S>(schema);
    if (uiSchema && keyword in uiSchema) {
      if (Array.isArray(uiSchema[keyword])) {
        return uiSchema[keyword];
      }
      logOnce(`uiSchema.${keyword} is not an array for ${fieldLabelForLog(id, fieldPath)}`);
    }
    return [];
  }, [uiSchema, schema, id, fieldPath]);

  const switchOption = useCallback(
    (index: number, ownValues?: GenericObjectType) => {
      const newIndex = index >= 0 ? index : -1;
      if (disabled || readonly || (newIndex === selectedOption && !ownValues)) {
        return;
      }
      const newOption = newIndex >= 0 ? options[newIndex] : undefined;
      const oldOption = selectedOption >= 0 ? options[selectedOption] : undefined;
      // The registry's `ui:definitions` are passed beside each option's uiSchema, which never carries the root's
      const newUiSchema = selectOptionUiSchema<T, S, F>(optionsUiSchema, uiSchema, newIndex);
      const oldUiSchema = selectOptionUiSchema<T, S, F>(optionsUiSchema, uiSchema, selectedOption);
      const switched = formDataForNewOption<T, S, F>(schemaUtils, formData, newOption, oldOption, schema, {
        newOptionUiSchema: newUiSchema,
        oldOptionUiSchema: oldUiSchema,
        uiSchemaDefinitions,
        globalUiOptions,
      });
      // A cleared selection and a `null` option render no field, so none of the field's own values is held there
      const holdsNothing = newOption === undefined || holdsOnlyNull<S>(newOption);
      const sent = ownValues && !holdsNothing ? withOwnValues(switched, ownValues, fieldPath) : switched;
      // Selected before the switch is sent, so the change's sanitize and live omit read the option it switches to
      selectOption(newIndex);
      let sentData: unknown;
      const outcome = sendOptionSwitch(
        schema,
        {
          oldOption,
          newOption,
          oldUiSchema,
          newUiSchema,
          oldIndex: selectedOption,
        },
        formData,
        sent,
        (value) => {
          sentData = value;
          onChange(value, fieldPath, undefined, changedId);
        },
      );
      selectSwitchedOption<T, S, F>(
        selectOption,
        schemaUtils,
        { from: selectedOption, to: newIndex, newOption },
        formData,
        sentData,
        outcome,
      );
    },
    [
      disabled,
      readonly,
      selectedOption,
      options,
      optionsUiSchema,
      uiSchema,
      schema,
      schemaUtils,
      uiSchemaDefinitions,
      globalUiOptions,
      formData,
      fieldPath,
      onChange,
      changedId,
      selectOption,
      sendOptionSwitch,
    ],
  );
  return useMemo(
    () => ({ selectedOption, optionsUiSchema, switchOption }),
    [selectedOption, optionsUiSchema, switchOption],
  );
}
