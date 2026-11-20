import { ADDITIONAL_ITEMS_KEY, ITEMS_KEY } from '../constants.ts';
import isFixedItems from '../isFixedItems.ts';
import { isSchemaObject } from '../isObject.ts';
import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from '../types.ts';

/** The items `schema` describes by position: its `prefixItems`, which take the place of a tuple `items`, or its tuple
 * `items` */
function prefixOf(schema: GenericObjectType): unknown[] | undefined {
  const prefix: unknown = Array.isArray(schema.prefixItems) ? schema.prefixItems : schema.items;
  return Array.isArray(prefix) ? prefix : undefined;
}

/** The keyword describing the items past `schema`'s tuple: the `items` beside `prefixItems`, or the `additionalItems`
 * beside a tuple `items` */
export function getRestItemsKey<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
): typeof ITEMS_KEY | typeof ADDITIONAL_ITEMS_KEY {
  return Array.isArray((schema as GenericObjectType).prefixItems) ? ITEMS_KEY : ADDITIONAL_ITEMS_KEY;
}

/** Returns the number of items `schema` describes by position, through `prefixItems` or a tuple `items`
 *
 * @param schema - The array schema
 * @returns - The length of its `prefixItems` or tuple `items`, or 0 where it declares neither
 */
export function getPrefixLength<S extends StrictRJSFSchema = RJSFSchema>(schema: S): number {
  return prefixOf(schema as GenericObjectType)?.length ?? 0;
}

/** Returns the schema `schema` declares for its item at `index`: the `prefixItems` or tuple `items` entry there, and
 * past them its `items`, or the `additionalItems` beside a tuple. A position it declares nothing at, or something
 * other than a schema at, such as an array `items` beside `prefixItems`, which mixes the two ways of writing a tuple,
 * constrains nothing and is `true`
 *
 * @param schema - The array schema
 * @param index - The index of the item
 * @returns - The item's schema, as written: a schema, `true` where nothing constrains it, or `false` where no item is
 *      allowed there
 */
export function getItemSchema<S extends StrictRJSFSchema = RJSFSchema>(schema: S, index: number): S | boolean {
  const prefix = prefixOf(schema as GenericObjectType);
  const rest: unknown = (schema as GenericObjectType)[prefix === undefined ? ITEMS_KEY : getRestItemsKey<S>(schema)];
  const raw: unknown = prefix && index < prefix.length ? prefix[index] : rest;
  return typeof raw === 'boolean' || isSchemaObject<S>(raw) ? raw : true;
}

/** Whether `schema` is a tuple, which `ArrayField` renders position by position: it declares `prefixItems`, whose
 * positions may be `true` or `false` as any subschema may, or without them its `items` is a list of schema objects, as
 * `isFixedItems()` checks
 *
 * @param schema - The array schema
 * @returns - True where `schema` declares a tuple
 */
export function isTupleSchema<S extends StrictRJSFSchema = RJSFSchema>(schema: S): boolean {
  return Array.isArray((schema as GenericObjectType).prefixItems) || isFixedItems<S>(schema);
}

/** Returns the number of positions of `schema`'s tuple an item can be held at: its `getPrefixLength()`, cut short at
 * its first `false` position, at and past which no item is allowed
 *
 * @param schema - The array schema
 * @returns - The number of positions before the first `false` one, or the length of the tuple where it has none
 */
export function getOpenPrefixLength<S extends StrictRJSFSchema = RJSFSchema>(schema: S): number {
  const prefix = prefixOf(schema as GenericObjectType) ?? [];
  const closedAt = prefix.indexOf(false);
  return closedAt === -1 ? prefix.length : closedAt;
}
