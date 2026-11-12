import { CONST_KEY, GUESSED_TYPE_FLAG } from '../constants.ts';
import deepEquals from '../deepEquals.ts';
import getXxxOfOptions from '../getXxxOfOptions.ts';
import hasSchemaMarker from '../hasSchemaMarker.ts';
import isObject, { isSchemaObject } from '../isObject.ts';
import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from '../types.ts';

/** The items `schema` describes by position: its `prefixItems`, which take the place of a tuple `items`, or its tuple
 * `items` */
function prefixOf(schema: GenericObjectType): unknown[] | undefined {
  const prefix: unknown = Array.isArray(schema.prefixItems) ? schema.prefixItems : schema.items;
  return Array.isArray(prefix) ? prefix : undefined;
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
  const { items, prefixItems, additionalItems } = schema as GenericObjectType;
  const prefix = prefixOf(schema as GenericObjectType);
  // Past `prefixItems` the items are `items`, and past a tuple `items` they are `additionalItems`
  const rest: unknown = prefix === undefined || prefix === prefixItems ? items : additionalItems;
  const raw: unknown = prefix && index < prefix.length ? prefix[index] : rest;
  return typeof raw === 'boolean' || isSchemaObject<S>(raw) ? raw : true;
}

/** The values `schema` lists through its `enum` or its constant `anyOf`/`oneOf` options, or undefined where it lists
 * none to check a value against */
function enumValuesForSchema<S extends StrictRJSFSchema = RJSFSchema>(schema: S): unknown[] | undefined {
  // An empty `enum` lists no value to check against, which is how the `anyOf`/`oneOf` below and `isConstantSelect()`
  // both read one, so it offers no constraint rather than rejecting everything
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum;
  }

  const options: unknown[] = getXxxOfOptions<S>(schema)?.options ?? [];
  const values: unknown[] = [];
  for (const option of options) {
    if (isObject(option) && CONST_KEY in option) {
      values.push(option[CONST_KEY]);
    } else if (isObject(option) && Array.isArray(option.enum)) {
      values.push(...option.enum);
    } else {
      // An option with neither a `const` nor an `enum` accepts values beyond the listed ones, so a value outside them
      // may still be valid and there is no list to check it by
      return undefined;
    }
  }

  return values.length > 0 ? values : undefined;
}

/** Whether `newSchema` declares the same type, `const`, `enum` or constant options, `maxItems` and `default` as
 * `oldSchema`, a `default` the schema holding it declares for it standing in for its own as it does for the defaults.
 * A type guessed from the data (see `GUESSED_TYPE_FLAG`) describes the data rather than the schema, so it is read as no
 * type. These are the constraints that decide whether a field the data holds as `undefined`, a clear, stays one across
 * a schema change, or gives way to the new schema's defaults
 *
 * @param oldSchema - The field's schema before the change
 * @param newSchema - The field's schema after the change
 * @param oldInheritedDefault - The default the schema holding `oldSchema` declares for it
 * @param newInheritedDefault - The default the schema holding `newSchema` declares for it
 * @returns - Whether both schemas constrain the field alike
 */
export function constrainsAlike<S extends StrictRJSFSchema = RJSFSchema>(
  oldSchema: S,
  newSchema: S,
  oldInheritedDefault: unknown,
  newInheritedDefault: unknown,
): boolean {
  const declaredType = (schema: S) => (hasSchemaMarker(schema, GUESSED_TYPE_FLAG) ? undefined : schema.type);
  return (
    isSameType(declaredType(oldSchema), declaredType(newSchema)) &&
    deepEquals(oldSchema.const, newSchema.const) &&
    oldSchema.maxItems === newSchema.maxItems &&
    deepEquals(oldSchema.default ?? oldInheritedDefault, newSchema.default ?? newInheritedDefault) &&
    deepEquals(enumValuesForSchema<S>(oldSchema), enumValuesForSchema<S>(newSchema))
  );
}

/** Whether two schemas' `type`s name the same types. A list is compared by what it names rather than by identity or
 * order, since the two schemas declaring it are usually separate objects and `['null', 'string']` allows what
 * `['string', 'null']` does
 */
function isSameType(oldType: unknown, newType: unknown): boolean {
  if (oldType === newType) {
    return true;
  }
  if (!Array.isArray(oldType) || !Array.isArray(newType)) {
    return false;
  }
  const newTypes = new Set<unknown>(newType);
  const oldTypes = new Set<unknown>(oldType);
  return oldTypes.size === newTypes.size && oldType.every((type) => newTypes.has(type));
}

/** Says whether `newType` names every type `oldType` names, so that it allows any value of the old type. A `number`
 * names `integer` too, since it allows every integer. This is how `Form` decides that an array item's type didn't
 * change
 *
 * @param oldType - The `type` a schema declared before the change, a type name or a list of them
 * @param newType - The `type` it declares after the change, a type name or a list of them
 * @returns - Whether `newType` allows every type `oldType` allows
 */
export function namesEveryType(oldType: unknown, newType: unknown): boolean {
  const newTypes = new Set<unknown>(Array.isArray(newType) ? newType : [newType]);
  return (Array.isArray(oldType) ? oldType : [oldType]).every(
    (type) => newTypes.has(type) || (type === 'integer' && newTypes.has('number')),
  );
}
