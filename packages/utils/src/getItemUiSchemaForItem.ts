import { toFieldPath } from './fieldPath.ts';
import getStaticItemsUiSchema from './getStaticItemsUiSchema.ts';
import logOnce from './logOnce.ts';
import type { FieldPath, FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

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
 * @param [arrayFieldPath] - The `FieldPath` of the array the item belongs to, used to name the item in the error
 *          logged when the function throws, so that two arrays whose functions fail the same way at the same index
 *          are reported separately. A caller that has no path to give (a custom `ArrayField`, say) can omit it, and
 *          the error names the index alone rather than a path the caller never supplied
 * @returns - The uiSchema for the item at `index`, or `undefined`
 */
export default function getItemUiSchemaForItem<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  uiSchema: UiSchema<T, S, F> | undefined,
  item: T,
  index: number,
  formContext?: F,
  arrayFieldPath?: FieldPath,
): UiSchema<T, S, F> | undefined {
  if (typeof uiSchema?.items === 'function') {
    try {
      return uiSchema.items(item as never, index, formContext) as UiSchema<T, S, F>;
    } catch (e) {
      // Without an `arrayFieldPath` there is no array to name, and `toFieldPath(index)` would read as `[0]`, which is
      // a real path: the root array's own item. Naming the index alone keeps the message from claiming to be about a
      // field it knows nothing about
      const itemLabel = arrayFieldPath === undefined ? `item at index ${index}` : toFieldPath(index, arrayFieldPath);
      logOnce(`Error executing dynamic uiSchema.items function for ${itemLabel}:`, 'error', e);
      return undefined;
    }
  }
  return getStaticItemsUiSchema<T, S, F>(uiSchema, index);
}
