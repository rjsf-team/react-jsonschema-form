import isObject, { isSchemaObject } from '../isObject.ts';
import type { RJSFSchema, StrictRJSFSchema } from '../types.ts';
import { getItemSchema, getPrefixLength } from './getItemSchema.ts';

/** Enum that indicates how `schema.additionalItems` should be handled by the `getInnerSchemaForArrayItem()` function.
 */
export const AdditionalItemsHandling = {
  Ignore: 0,
  Invert: 1,
  Fallback: 2,
} as const;
export type AdditionalItemsHandling = (typeof AdditionalItemsHandling)[keyof typeof AdditionalItemsHandling];

/** Given a `schema` will return an inner schema that for an array item. This is computed differently based on the
 * `additionalItems` enum and the value of `idx`. A tuple's positions are its `prefixItems`, or its `items` where it
 * declares no `prefixItems`, and the items past them are described by the `items` beside `prefixItems`, or the
 * `additionalItems` beside a tuple `items` (see `getItemSchema()`). There are four possible returns:
 * 1. If `idx` is >= 0 and within a tuple, the position at `idx` is returned, or {} for a boolean position.
 * 2. If `schema` is not a tuple and `schema.items` is a schema object, then `schema.items` is returned, otherwise it
 *    falls through to 3.
 * 3. If `additionalItems` is not `AdditionalItemsHandling.Ignore` and the schema of the items past the tuple, or
 *    `schema.additionalItems` where `schema` is no tuple, is an object, then it is returned since it actually is a
 *    schema, otherwise it falls through to 4.
 * 4. {} is returned representing an empty schema
 *
 * @param schema - The schema from which to get the particular item
 * @param [additionalItems=AdditionalItemsHandling.Ignore] - How do we want to handle additional items?
 * @param [idx=-1] - Index, if non-negative, will be used to return the idx-th position of a tuple
 * @returns - The best fit schema object from the `schema` given the `additionalItems` and `idx` modifiers
 */
export function getInnerSchemaForArrayItem<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  additionalItems: AdditionalItemsHandling = AdditionalItemsHandling.Ignore,
  idx = -1,
): S {
  const prefixLength = getPrefixLength<S>(schema);
  if (prefixLength > 0) {
    if (idx >= 0 && idx < prefixLength) {
      const item = getItemSchema<S>(schema, idx);
      return typeof item === 'boolean' ? ({} as S) : item;
    }
  } else if (idx < 0 && isSchemaObject<S>(schema.items)) {
    return schema.items;
  }
  const rest = prefixLength > 0 ? getItemSchema<S>(schema, prefixLength) : schema.additionalItems;
  if (additionalItems !== AdditionalItemsHandling.Ignore && isObject(rest)) {
    return rest as S;
  }
  return {} as S;
}
