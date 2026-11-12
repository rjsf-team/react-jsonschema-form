import { useCallback, useMemo } from 'react';
import type { FieldProps, FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import {
  deepEquals,
  getDiscriminatorFieldFromSchema,
  getRenderedOptionSchema,
  isConstant,
  selectOptionUiSchema,
  toConstant,
} from '@rjsf/utils';

import defaultsForOption from '../components/fields/defaultsForOption.ts';
import { optionsKeywordOf, takesTypeOf } from '../components/fields/fieldWidgetUtils.ts';
import useOptionSelection from './useOptionSelection.ts';
import useSendOptionSwitch, { selectSwitchedOption } from './useSendOptionSwitch.ts';

/** The props of a field `useOptionSwitch()` reads */
export type OptionSwitchFieldProps<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
> = Pick<FieldProps<T, S, F>, 'schema' | 'uiSchema' | 'fieldPath' | 'formData' | 'onChange' | 'registry' | 'id'> &
  Partial<Pick<FieldProps<T, S, F>, 'disabled' | 'readonly'>>;

/** The option an `anyOf`/`oneOf` field shows, and how to switch to another */
export interface OptionSwitchState {
  /** The index of the option shown, -1 when there are no options */
  selectedOption: number;
  /** Switches the field to the option at `index`, or clears the selection for an `index` below 0. The field sends what
   * it holds, filled with what the option starts from, and the form it is rendered in judges each value against the
   * option switched away from and the one switched to: it replaces what the old option's defaults filled in, sets
   * aside what the new option has no field for, and brings back what was set aside under the option if the user
   * returns to it. Does nothing for a `disabled` or `readonly` field, or for the option already shown
   */
  switchOption: (index: number) => void;
}

/** Shows and switches the option of an `anyOf`/`oneOf` field, as `AnyOfField` and `OneOfField` do. A custom field that
 * renders its own option selector calls it with its props and its options, shows `selectedOption`, and calls
 * `switchOption()` when the user picks another: the selection and the data change together, through the form.
 *
 * Outside a `Form` nothing judges the data, so a switch only fills the option switched to.
 *
 * @param props - The field's props
 * @param options - The field's options, each retrieved for its data as `SchemaField` retrieves them
 * @param [selectorId=props.id] - The id of the control that switches, which `onChange` is told the change came from
 * @returns - The option shown and the function that switches to another
 */
export default function useOptionSwitch<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(props: OptionSwitchFieldProps<T, S, F>, options: readonly S[], selectorId?: string): OptionSwitchState {
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
    if (uiSchema && keyword in uiSchema && Array.isArray(uiSchema[keyword])) {
      return uiSchema[keyword];
    }
    return [];
  }, [uiSchema, schema]);

  const switchOption = useCallback(
    (index: number) => {
      const newIndex = index >= 0 ? index : -1;
      if (disabled || readonly || newIndex === selectedOption) {
        return;
      }
      const newOption = newIndex >= 0 ? options[newIndex] : undefined;
      const oldOption = selectedOption >= 0 ? options[selectedOption] : undefined;
      // The registry's `ui:definitions` are passed beside each option's uiSchema, which never carries the root's
      const newUiSchema = selectOptionUiSchema<T, S, F>(optionsUiSchema, uiSchema, newIndex);
      const oldUiSchema = selectOptionUiSchema<T, S, F>(optionsUiSchema, uiSchema, selectedOption);
      // A cleared selection and a `null` option render no field, so nothing is held there. Any other option gets the
      // data as it is: the form judges each value against the option switched to and fills what that option declares
      const holdsNothing =
        newOption === undefined ||
        newOption.type === 'null' ||
        (isConstant<S>(newOption) && toConstant<S>(newOption) === null);
      // `''` is what a cleared `additionalProperties` entry holds for nothing, see `storedValue()`
      const heldNothing = formData === undefined || formData === null || (formData as unknown) === '';
      // A value of a JSON type the option cannot hold is not carried either, and neither is one that is not the
      // constant the option names, so the field keeps its place in its container with what the option starts from
      const renderedNewOption = newOption && getRenderedOptionSchema<S>(schema, newOption);
      const carriesNothing =
        heldNothing ||
        (renderedNewOption !== undefined &&
          (!takesTypeOf<S>(renderedNewOption, formData) ||
            (isConstant<S>(renderedNewOption) && !deepEquals(toConstant<S>(renderedNewOption), formData))));
      const carried =
        newOption &&
        defaultsForOption<T, S, F>(schemaUtils, schema, newOption, carriesNothing ? undefined : formData, {
          optionUiSchema: newUiSchema,
          uiSchemaDefinitions,
          globalUiOptions,
        });

      // Selected before the switch is sent, so the change's sanitize and live omit read the option it switches to
      selectOption(newIndex);
      let sentData: unknown;
      const outcome = sendOptionSwitch(
        schema,
        { oldOption, newOption, oldUiSchema, newUiSchema, oldIndex: selectedOption },
        formData,
        holdsNothing ? undefined : carried,
        (sent) => {
          sentData = sent;
          onChange(sent, fieldPath, undefined, changedId);
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
  return useMemo(() => ({ selectedOption, switchOption }), [selectedOption, switchOption]);
}
