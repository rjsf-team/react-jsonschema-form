import getStaticItemsUiSchema from './getStaticItemsUiSchema.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Returns the `uiSchema` that applies to the array item at `index`, given that item's actual `formData`. Unlike
 * `getStaticItemsUiSchema()` (used when only the tuple position is known, e.g. for a `minItems` filler or a newly
 * added row, with no item data yet), this also resolves the function form of `uiSchema.items`, calling it with
 * `item`/`index`/`formContext` the same way `ArrayField` does while rendering. If the function throws, the error is
 * logged and `undefined` is returned so the caller can still proceed without that item's uiSchema, matching what
 * `ArrayField` shows the user in that case.
 *
 * @param [uiSchema] - The parent (array) uiSchema, if any
 * @param item - The item's own form data
 * @param index - The tuple position `uiSchema.items` should apply to, when it is given as an array or a function
 * @param [formContext] - The formContext to pass to the function form of `uiSchema.items`
 * @returns - The uiSchema for the item at `index`, or `undefined`
 */
export default function getItemUiSchemaForItem<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(uiSchema: UiSchema<T, S, F> | undefined, item: T, index: number, formContext?: F): UiSchema<T, S, F> | undefined {
  if (typeof uiSchema?.items === 'function') {
    try {
      return uiSchema.items(item as never, index, formContext) as UiSchema<T, S, F>;
    } catch (e) {
      // oxlint-disable-next-line no-console
      console.error(`Error executing dynamic uiSchema.items function for item at index ${index}:`, e);
      return undefined;
    }
  }
  return getStaticItemsUiSchema<T, S, F>(uiSchema, index);
}
