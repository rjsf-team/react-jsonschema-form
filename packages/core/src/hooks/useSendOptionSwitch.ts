import { use, useCallback } from 'react';
import type { FieldPath, StrictRJSFSchema, UiSchema } from '@rjsf/utils';
import { deepEquals, deepEqualsUndefinedAsMissing, getRenderedOptionSchema } from '@rjsf/utils';

import FormDataContext from '../components/FormDataContext.ts';

/** The options of an `anyOf`/`oneOf` field a switch leaves and selects, each with the uiSchema its field renders with */
interface OptionSwitch<S extends StrictRJSFSchema> {
  /** The option switched away from */
  oldOption: S | undefined;
  /** The option switched to */
  newOption: S | undefined;
  /** The uiSchema the field of the option switched away from rendered with */
  oldUiSchema: UiSchema<any, S, any> | undefined;
  /** The uiSchema the field of the option switched to renders with */
  newUiSchema: UiSchema<any, S, any> | undefined;
}

/** Whether the options of `schema` a switch leaves and selects render the items of an array alike, as
 * `MultiSchemaField` renders each option with what it inherits from `schema`. `uniqueItems` can turn enumerated items
 * into one multi-select, which renders no field per item, and the uiSchema picks the field each item renders with. The
 * uiSchemas are compared by identity, since `deepEquals()` reads any two fields named by `ui:field` as equal, so options
 * given uiSchemas of their own render their items alike only when they share one
 *
 * @param schema - The schema holding the options
 * @param optionSwitch - The options switched between, with their uiSchemas
 * @returns - True when both options render the same items
 */
function rendersItemsAlike<S extends StrictRJSFSchema>(
  schema: S,
  { oldOption, newOption, oldUiSchema, newUiSchema }: OptionSwitch<S>,
): boolean {
  if (!oldOption || !newOption || oldUiSchema !== newUiSchema) {
    return false;
  }
  const oldRendered = getRenderedOptionSchema<S>(schema, oldOption);
  const newRendered = getRenderedOptionSchema<S>(schema, newOption);
  return (
    oldRendered.items !== undefined &&
    deepEquals(oldRendered.items, newRendered.items) &&
    deepEquals(oldRendered.additionalItems, newRendered.additionalItems) &&
    oldRendered.uniqueItems === newRendered.uniqueItems
  );
}

/** Returns what sends the change of a `oneOf`/`anyOf` field at `fieldPath` whose option is switched. The option's
 * fields are rendered anew under the new option's schema, so the form drops the fields' own errors under every key the
 * option that was left declared or the data held: a raise of a widget that is gone, or that another widget now renders
 * for, would stand with no field to clear it. The validator's errors go only under the keys the new option does not
 * declare, since those under a key it declares too may describe a constraint it shares. The keys of the properties
 * `schema` declares beside its options keep everything, since those fields stay as they are, and so do the indices of
 * an array the switch carries over at the same length to an option that renders its items as the option left did,
 * since the fields of the items it still holds stay as they are too. A change of length has `ArrayField` key every
 * item anew, which mounts each item's field afresh. The errors raised at the field's own path go too, whatever the
 * options declare.
 */
export default function useSendOptionSwitch(fieldPath: FieldPath) {
  const access = use(FormDataContext);
  return useCallback(
    <S extends StrictRJSFSchema>(
      schema: S,
      optionSwitch: OptionSwitch<S>,
      formData: unknown,
      newFormData: unknown,
      send: () => void,
    ) => {
      if (!access) {
        send();
        return;
      }
      const { oldOption, newOption } = optionSwitch;
      const kept = schema.properties ?? {};
      // An item only keeps its errors while it still holds what it held: one an option's `default` replaced is another
      // value under the same index
      const items =
        Array.isArray(formData) &&
        Array.isArray(newFormData) &&
        formData.length === newFormData.length &&
        rendersItemsAlike(schema, optionSwitch)
          ? { before: formData as unknown[], after: newFormData as unknown[] }
          : undefined;
      const isKeptItem = (index: number) =>
        items !== undefined && deepEqualsUndefinedAsMissing(items.after[index], items.before[index]);
      const isKept = (key: string) => Object.hasOwn(kept, key) || (/^\d+$/.test(key) && isKeptItem(Number(key)));
      const declaredByNew = newOption?.properties ?? {};
      const held = typeof formData === 'object' && formData !== null ? Object.keys(formData) : [];
      const gone = new Set([...Object.keys(oldOption?.properties ?? {}), ...held].filter((key) => !isKept(key)));
      access.sendMove(
        {
          fieldPath,
          newKeyOf: (key) => (gone.has(key) && !Object.hasOwn(declaredByNew, key) ? undefined : key),
          newOwnKeyOf: (key) => (gone.has(key) ? undefined : key),
          dropsOwnErrors: true,
        },
        send,
      );
    },
    [access, fieldPath],
  );
}
