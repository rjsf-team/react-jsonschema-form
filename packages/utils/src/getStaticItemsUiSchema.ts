import { ADDITIONAL_ITEMS_KEY, ITEMS_KEY, PREFIX_ITEMS_KEY } from './constants.ts';
import { getPrefixLength, getRestItemsKey, isTupleSchema } from './schema/getItemSchema.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Returns the uiSchema key the array item at `index` of `schema` reads its uiSchema from, mirroring the schema
 * keyword that describes it: `prefixItems` for a position of a `prefixItems` tuple, `additionalItems` past a tuple
 * `items`, and `items` otherwise, which past a `prefixItems` tuple describes the items as the schema's `items` does
 *
 * @param schema - The array schema
 * @param index - The index of the item
 * @returns - The uiSchema key holding the item's uiSchema
 */
export function getItemsUiSchemaKey<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  index: number,
): typeof ITEMS_KEY | typeof PREFIX_ITEMS_KEY | typeof ADDITIONAL_ITEMS_KEY {
  if (!isTupleSchema<S>(schema)) {
    return ITEMS_KEY;
  }
  if (index < getPrefixLength<S>(schema)) {
    return Array.isArray(schema.prefixItems) ? PREFIX_ITEMS_KEY : ITEMS_KEY;
  }
  return getRestItemsKey<S>(schema);
}

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
 * Given the array's `schema` and an `index`, the item reads the uiSchema key `getItemsUiSchemaKey()` names.
 *
 * @param [uiSchema] - The parent (array) uiSchema, if any
 * @param [index] - The tuple position `uiSchema.items` should apply to, when it is given as an array
 * @param [schema] - The array schema, which picks the uiSchema key an item at `index` reads
 * @returns - The static `items` uiSchema for `index`, or `undefined`
 */
export default function getStaticItemsUiSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(uiSchema?: UiSchema<T, S, F>, index?: number, schema?: S): UiSchema<T, S, F> | undefined {
  if (schema && index !== undefined) {
    const key = getItemsUiSchemaKey<S>(schema, index);
    if (key === PREFIX_ITEMS_KEY) {
      return uiSchema?.prefixItems?.[index] as UiSchema<T, S, F> | undefined;
    }
    if (key === ADDITIONAL_ITEMS_KEY) {
      return uiSchema?.additionalItems as UiSchema<T, S, F> | undefined;
    }
  }
  const { items } = uiSchema ?? {};
  if (typeof items === 'function') {
    return undefined;
  }
  if (Array.isArray(items)) {
    return index === undefined ? undefined : (items[index] as UiSchema<T, S, F> | undefined);
  }
  return items as UiSchema<T, S, F> | undefined;
}
