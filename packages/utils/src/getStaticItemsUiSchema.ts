import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Returns the plain-object form of `uiSchema.items` that applies at tuple position `index`, or `undefined` when
 * `uiSchema.items` can't be resolved without more context than is available when only computing defaults.
 *
 * `uiSchema.items` can take three forms: a single object applying uniformly to every array item, an array of
 * per-tuple-position objects, or a `(itemData, index, formContext) => UiSchema` function. The function form needs an
 * item's data, index and form context to resolve, none of which is available here: there's no item yet for a
 * filler/new entry, and these callers don't have a formContext in scope to begin with, so it always resolves to
 * `undefined`. The array (tuple) form resolves to the entry at `index`, or `undefined` when no `index` is given —
 * there's no single position to pick a uniform value from in that case.
 *
 * @param [uiSchema] - The parent (array) uiSchema, if any
 * @param [index] - The tuple position `uiSchema.items` should apply to, when it is given as an array
 * @returns - The static `items` uiSchema for `index`, or `undefined`
 */
export default function getStaticItemsUiSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(uiSchema?: UiSchema<T, S, F>, index?: number): UiSchema<T, S, F> | undefined {
  const { items } = uiSchema ?? {};
  if (typeof items === 'function') {
    return undefined;
  }
  if (Array.isArray(items)) {
    return index === undefined ? undefined : (items[index] as UiSchema<T, S, F> | undefined);
  }
  return items as UiSchema<T, S, F> | undefined;
}
