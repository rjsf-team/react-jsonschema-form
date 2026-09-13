import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Returns the plain-object form of `uiSchema.items`, or `undefined` when it's the dynamic
 * `(itemData, index, formContext) => UiSchema` function form (or absent). The function form needs an item's data,
 * index and form context to resolve, none of which is available when only computing defaults: there's no item yet
 * for a filler/new entry, and these callers don't have a formContext in scope to begin with.
 *
 * @param [uiSchema] - The parent (array) uiSchema, if any
 * @returns - The static `items` uiSchema, or `undefined`
 */
export default function getStaticItemsUiSchema<
  T = any,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = any,
>(uiSchema?: UiSchema<T, S, F>): UiSchema<T, S, F> | undefined {
  return typeof uiSchema?.items === 'function' ? undefined : (uiSchema?.items as UiSchema<T, S, F> | undefined);
}
