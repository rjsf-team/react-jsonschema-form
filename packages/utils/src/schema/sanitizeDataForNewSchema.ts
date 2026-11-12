import {
  ADDITIONAL_PROPERTY_FLAG,
  CONST_KEY,
  DEFAULT_KEY,
  GUESSED_TYPE_FLAG,
  PROPERTIES_KEY,
  REF_KEY,
} from '../constants.ts';
import constIsAjvDataReference from '../constIsAjvDataReference.ts';
import deepEquals from '../deepEquals.ts';
import getPropertySchema from '../getPropertySchema.ts';
import getSchemaOwnTypes from '../getSchemaOwnTypes.ts';
import getSchemaType from '../getSchemaType.ts';
import { getKnownTypes } from '../getUnionTypes.ts';
import getXxxOfKey from '../getXxxOfKey.ts';
import getXxxOfOptions from '../getXxxOfOptions.ts';
import hasSchemaMarker from '../hasSchemaMarker.ts';
import isConstantSelect from '../isConstantSelect.ts';
import isContainerValue from '../isContainerValue.ts';
import isObject, { isSchemaObject } from '../isObject.ts';
import isPlainObject from '../isPlainObject.ts';
import isWholeValueSelect from '../isWholeValueSelect.ts';
import { getByPath, hasByPath } from '../pathUtils.ts';
import type {
  FieldFill,
  FormContextType,
  GenericObjectType,
  PropertyPlacement,
  RJSFSchema,
  SchemaContext,
  StrictRJSFSchema,
} from '../types.ts';
import { ownValue } from './getDefaultFormState.ts';
import getFilledDefault from './getFilledDefault.ts';
import resolveConstantOptions from './resolveConstantOptions.ts';
import retrieveSchema, { ownRefResolves } from './retrieveSchema.ts';

const NO_VALUE = Symbol('no Value');

/** The keywords that describe an array's items by position, or that leave them undescribed when none is declared */
const TUPLE_KEYWORDS = ['items', 'prefixItems', 'additionalItems'] as const;
const ITEMS_KEYWORDS = ['items', 'prefixItems'] as const;

/** The schema of an item no items keyword constrains, as a missing or `true` one doesn't. Shared, so that two positions
 * both declaring none are resolved once */
const ANY_ITEM = {};

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

/** The raw schema `schema` declares for its item at `index`, one constraining nothing being `ANY_ITEM` */
function itemSchemaAt<S extends StrictRJSFSchema = RJSFSchema>(schema: S, index: number): S | false {
  const raw = getItemSchema<S>(schema, index);
  return raw === true ? (ANY_ITEM as S) : raw;
}

/** How the items at one position of an array are sanitized: the raw and resolved schemas each side declares there, or
 * `false` where both reject any item there, which keeps one for validation to report */
type ItemPosition<S> =
  | { newRaw: S; oldRaw: S; newItems: S; schemaType: string | undefined; listedTypes: string[]; isWholeSelect: boolean }
  | false;

function enumValuesForSchema<S extends StrictRJSFSchema = RJSFSchema>(schema: S): unknown[] | undefined {
  // An empty `enum` lists no value to check against, which is how the `anyOf`/`oneOf` below and `isConstantSelect()`
  // both read one, so it offers no constraint rather than rejecting everything
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum;
  }

  const xxxOfKey = getXxxOfKey<S>(schema);
  if (!xxxOfKey) {
    return undefined;
  }
  const options = schema[xxxOfKey] as (S | boolean)[];
  // An option with neither a `const` nor an `enum` accepts values beyond the listed ones, so a value outside them may
  // still be valid and there is no list to check it by
  if (!options.every((option) => isObject(option) && (CONST_KEY in option || Array.isArray(option.enum)))) {
    return undefined;
  }

  const values = (options as S[]).flatMap((option) => (CONST_KEY in option ? [option[CONST_KEY]] : option.enum!));

  return values.length > 0 ? values : undefined;
}

/** Returns the values the old schema's select lists, its constant options written as `$ref`s read as the definitions
 * they name under `rootSchema`, as the new schema's are read. The old schema can come from another root, where an
 * option's `$ref` names nothing under this one: such a list lists no values, so it agrees with no list the new schema
 * offers, and the new schema's options decide.
 *
 * @param oldSchema - The old schema
 * @param rootSchema - The root schema of the new schema
 * @returns - The values the select lists, or undefined when it lists none
 */
function oldListedValues<S extends StrictRJSFSchema = RJSFSchema>(oldSchema: S, rootSchema: S): unknown[] | undefined {
  const options = getXxxOfOptions<S>(oldSchema)?.options ?? [];
  return options.every((option) => !isSchemaObject<S>(option) || ownRefResolves<S>(option, rootSchema))
    ? enumValuesForSchema<S>(resolveConstantOptions<S>(oldSchema, rootSchema))
    : undefined;
}

/** What `data` is replaced with where `newSchema` declares a `const` that `sanitized`, the data once sanitized, isn't,
 * and `oldSchema` didn't declare the same one, or `NO_VALUE` where the `const` doesn't reject it. An object `const` is
 * read as `constIsAjvDataReference()` reads it, as the defaults do. An array is compared with an object `const` only
 * where the schema declares `type: 'object'`, since an ajv `$data` reference is an object. A `const` the old schema
 * already declared was rejecting the data before the switch too, so the data is kept for validation to report rather
 * than dropped.
 *
 * The replacement is a copy of the new `const` where `data` holds the old one, as a scalar property's is, and otherwise
 * nothing, which clears a property and drops an array item. Copied as the defaults copy it, so neither the schema nor
 * another item replaced alike shares an object the caller may change
 */
function constReplacement<S extends StrictRJSFSchema = RJSFSchema>(
  newSchema: S,
  oldSchema: S | undefined,
  sanitized: unknown,
  data: unknown,
): unknown {
  const newConst: unknown = newSchema.const;
  const isValueConst =
    (newConst !== undefined && !isContainerValue(newConst)) ||
    Array.isArray(newConst) ||
    ((!Array.isArray(sanitized) || newSchema.type === 'object') &&
      isPlainObject(newConst) &&
      !constIsAjvDataReference<S>(newSchema));
  if (!isValueConst || deepEquals(newConst, sanitized) || deepEquals(oldSchema?.const, newConst)) {
    return NO_VALUE;
  }
  return deepEquals(oldSchema?.const, data) ? ownValue(newConst) : undefined;
}

/** What an array item is replaced with where `newSchema`, its items schema, declares a `const` that rejects it, as
 * `constReplacement()` decides it. A scalar `const` is checked as a scalar property's is: an item it rejects takes it
 * where it holds the old `const`, and is dropped otherwise, even where the old schema declared the same one, since it
 * holds nothing to sanitize. Only an object or array `const` keeps the data it rejected before the switch, for
 * validation to report
 */
function itemConstReplacement<S extends StrictRJSFSchema = RJSFSchema>(
  newSchema: S,
  oldSchema: S,
  sanitized: unknown,
  data: unknown,
): unknown {
  const newConst: unknown = newSchema.const;
  if (isContainerValue(newConst)) {
    return constReplacement<S>(newSchema, oldSchema, sanitized, data);
  }
  if (deepEquals(newConst, data)) {
    return NO_VALUE;
  }
  return deepEquals(oldSchema.const, data) ? ownValue(newConst) : undefined;
}

/** Whether `newSchema` declares the same type, `const`, `enum` or constant options, `maxItems` and `default` as
 * `oldSchema`, each `default` read as the one the defaults fill the field with, see `getFilledDefault()`.
 * A type guessed from the data (see `GUESSED_TYPE_FLAG`) describes the data rather than the schema, so it is read as no
 * type. These are the constraints that decide whether a field the data holds as `undefined`, a clear, stays one across
 * a schema change, or gives way to the new schema's defaults, as `sanitizeDataForNewSchema()` and an `anyOf`/`oneOf`
 * switch decide it
 *
 * @param context - The `SchemaContext` whose `defaultFormStateBehavior` says which default fills the field
 * @param oldSchema - The field's schema before the change
 * @param newSchema - The field's schema after the change
 * @param oldInheritedDefault - The default the field holding `oldSchema` was filled with for it
 * @param newInheritedDefault - The default the field holding `newSchema` is filled with for it
 * @param [oldPlacement] - Where the field sat as a property before the change, if it is one
 * @param [newPlacement] - Where the field sits as a property after the change, if it is one
 * @returns - Whether both schemas constrain the field alike
 */
export function constrainsAlike<S extends StrictRJSFSchema = RJSFSchema, F extends FormContextType = FormContextType>(
  context: SchemaContext<S, F>,
  oldSchema: S,
  newSchema: S,
  oldInheritedDefault: unknown,
  newInheritedDefault: unknown,
  oldPlacement?: PropertyPlacement,
  newPlacement?: PropertyPlacement,
): boolean {
  const declaredType = (schema: S) => (hasSchemaMarker(schema, GUESSED_TYPE_FLAG) ? undefined : schema.type);
  return (
    isSameType(declaredType(oldSchema), declaredType(newSchema)) &&
    deepEquals(oldSchema.const, newSchema.const) &&
    oldSchema.maxItems === newSchema.maxItems &&
    deepEquals(
      getFilledDefault<S, F>(context, oldSchema, oldInheritedDefault, oldPlacement),
      getFilledDefault<S, F>(context, newSchema, newInheritedDefault, newPlacement),
    ) &&
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
 * names `integer` too, since it allows every integer. This is how `sanitizeDataForNewSchema()` and `Form` decide that an
 * array item's type didn't change
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

/** What `formValue`, data holding no object, is sanitized to against the object schema `schema`: an empty object in
 * place of a value of another type where it declares `properties`, and otherwise nothing. Absent data stays absent, so
 * the defaults decide whether the object is added, as they do when the form mounts
 */
function emptyObjectFor<S extends StrictRJSFSchema>(schema: S, formValue: unknown): object | undefined {
  return formValue !== undefined && schema[PROPERTIES_KEY] ? {} : undefined;
}

/** What a property's or an item's `formValue` takes from `newDefault`, the default the new schema fills it with, where
 * that differs from it, as `Form` judges a field whose constraints changed: the new default where the value is
 * `oldDefault`, the one the old schema filled it with, or where `isNewClear`, a newly entered property's clear, and,
 * for a scalar or a select property, `undefined` where a `readOnly` new `default` stands in for a `const`. `Form` clears
 * no array or object it walks as a container for one. `NO_VALUE` keeps the value
 */
function defaultReplacement<S extends StrictRJSFSchema>(
  newSchema: S,
  newDefault: unknown,
  oldDefault: unknown,
  formValue: unknown,
  isNewClear: boolean,
  isScalar: boolean,
): unknown {
  if (newDefault === undefined || deepEquals(newDefault, formValue)) {
    return NO_VALUE;
  }
  if (isNewClear || (oldDefault !== undefined && deepEquals(oldDefault, formValue))) {
    return ownValue(newDefault);
  }
  return isScalar && newSchema.readOnly === true ? undefined : NO_VALUE;
}

/** `schema` read as the `array` its type list names, as `Form` walks an array value a type list holds whichever type
 * `getSchemaType()` renders the list as, and without the `properties` an `object` beside it declares, which would read
 * the array as an object. A schema naming no `array`, such as an old one that held no array, or one already read as an
 * `array` without `properties`, such as `['array', 'null']`, is returned as it is, so that no copy is made per item
 */
function asArraySchema<S extends StrictRJSFSchema>(schema: S): S {
  const namesArray = schema.type === 'array' || getKnownTypes<S>(schema).includes('array');
  return namesArray && (schema[PROPERTIES_KEY] || getSchemaType<S>(schema) !== 'array')
    ? { ...schema, type: 'array', [PROPERTIES_KEY]: undefined }
    : schema;
}

/** Whether `schema` renders an object the defaults fill key by key: an `object` one, or an untyped one declaring
 * `properties` of its own or through an option, as `Form` fills one. An untyped one declaring only
 * `additionalProperties` or `patternProperties` has no keys for a `default` to fill, the stubs `retrieveSchema()` adds
 * for the data's extra keys aside */
function rendersProperties<S extends StrictRJSFSchema>(schema: S): boolean {
  if (schema.type !== undefined) {
    return getSchemaType<S>(schema) === 'object';
  }
  return (
    Object.values(schema[PROPERTIES_KEY] ?? {}).some(
      (property) => !hasSchemaMarker(property, ADDITIONAL_PROPERTY_FLAG),
    ) ||
    (getXxxOfOptions<S>(schema)?.options.some(
      // shortcut: an option's `$ref` counts as an object unresolved; resolve it if one naming a scalar matters
      (option) => isObject(option) && (REF_KEY in option || rendersProperties<S>(option)),
    ) ??
      false)
  );
}

function replacementForInvalidEnumValue<S extends StrictRJSFSchema = RJSFSchema>(schema: S, formValue: unknown) {
  const enumValues = enumValuesForSchema(schema);
  if (!enumValues || enumValues.some((value) => deepEquals(value, formValue))) {
    return NO_VALUE;
  }

  const defaultValue = getByPath(schema, DEFAULT_KEY, NO_VALUE);
  if (defaultValue !== NO_VALUE && enumValues.some((value) => deepEquals(value, defaultValue))) {
    return defaultValue;
  }

  return enumValues.length === 1 ? enumValues[0] : undefined;
}

/** Sanitize the `data` associated with the `oldSchema` so it is considered appropriate for the `newSchema`. If the new
 * schema does not contain any properties, then `undefined` is returned to clear all the form data. Due to the nature
 * of schemas, this sanitization happens recursively for nested objects of data. Also, any properties in the old schema
 * that are non-existent in the new schema, or that it declares with another type, are removed from the data at every
 * level, as is a property whose value the new schema rejects. A property the data holds as `undefined` stays so where
 * both schemas constrain it alike, and is otherwise removed unless a value replaces it. The data sanitization process
 * has the following flow:
 *
 * - If the `data` is an object or array equal to the new schema's `const`, return it as it is
 * - If the new schema is an object that contains a `properties` object then:
 *   - Create an empty `replacements` object, and a set of `discardedKeys` holding each key in the
 *     `oldSchema.properties` having `data`
 *   - Create an empty `nestedData` object for use in the key filtering below:
 *   - Iterate over each key in the `newSchema.properties` as follows:
 *     - Get the `formValue` of the key from the `data`
 *     - Get the `oldKeySchema` and `newKeyedSchema` for the key, defaulting to `{}` when it doesn't exist
 *     - Retrieve the schema for any refs within each `oldKeySchema` and/or `newKeySchema`
 *     - Get the types of the old and new keyed schemas and if the old doesn't exist or the old & new are the same then:
 *       - Delete the key from `discardedKeys`, since the new schema has the same property
 *       - If type of the key in the new schema is `object`, or its type or type list names `object` with plain
 *         object data or `array` with array data, and the key isn't a select (see `isConstantSelect()`):
 *         - Data equal to the old `default` takes a new one that differs, unless it is an object `getSchemaType()`
 *           reads as `object`, whose `default` the defaults fill key by key. A `readOnly` `default` clears no container
 *         - Otherwise, store the value from the recursive `sanitizeDataForNewSchema` call in `nestedData[key]`, array data
 *           against both schemas read as `array` (see `asArraySchema()`), or, for data that
 *           holds a value other than an object, an empty object when the new schema declares `properties`. Data the
 *           key does not hold is left out, and a `null` is removed, for the defaults to fill as they do on mount. What
 *           the new `const` rejects once sanitized, as below, takes the new `const` or is cleared
 *       - Otherwise, check for default, const or enum values:
 *         - Get the old and new `default` values from the schema and check:
 *           - If the new `default` value does not match the form value:
 *             - If the key is new and its form value is undefined, unless the data holds it as `undefined` and both
 *               schemas constrain it alike, or the old `default` matches the form value, then:
 *               - Replace `replacements[key]` with the new `default`
 *               - Otherwise, if the new schema is `readOnly` then replace `replacements[key]` with undefined
 *         - Get the old and new `const` values from the schema and check:
 *           - If the new `const` value does not match the form value:
 *           - If the old `const` value DOES match the form value, then:
 *             - Replace `replacements[key]` with the new `const`
 *             - Otherwise, replace `replacements[key]` with undefined
 *         - If the form value is none of the new `enum` or constant options, replace it with the new `default` when that
 *           is an option, the only option when there is one, or undefined, unless the data holds it as `undefined` and
 *           both schemas constrain it alike
 *   - A key replaced with `undefined` is removed, for the defaults to fill. A key the data holds as `undefined` stays
 *     so where both schemas constrain it alike (see `constrainsAlike()`), and is otherwise removed unless a value
 *     replaces it
 *   - Once all keys have been processed, return `{ ...data, ...replacements, ...nestedData }` without the keys
 *     left in `discardedKeys`
 * - If the new schema type, read through `getSchemaType()` so that a type list also allowing `null` counts, is array,
 *   the old schema's is too or it declares none, the `data` is an array, and the `data` is one of the new schema's
 *   `enum` or constant options when it lists any the old schema did not list alike, the options of both read with
 *   their `$ref`s resolved against `rootSchema`, where an old option whose `$ref` names nothing there lists no values,
 *   then:
 *   - Each position's schema is the `prefixItems` or tuple `items` entry there, and past them the `items`, or the
 *     `additionalItems` beside a tuple, one not declared or `true` constraining nothing, on each side, as does an old
 *     `false`, which shaped no element there. The items of an old schema declaring no type are read without the `type`
 *     they declare
 *   - The array is cleared where the old type was guessed from the data and the two schemas declare different items,
 *     or where an element reaches a position only the new side declares `false` at, or a prefix position whose new
 *     `type`s leave out one the old side declares, either declaring none counting as allowing any and a `number` as
 *     naming `integer`. An element past the
 *     new prefix reaching such a position is dropped instead. A position no element reaches clears nothing. Each
 *     position's schemas are retrieved against the `data` as an element first reaches it
 *   - Otherwise, for each element in the `data`, stopping at `maxItems` where it differs from the old schema's, since
 *     data already past an unchanged one is left for validation to report, an element past it clearing nothing:
 *     - An element at a position both sides declare `false` is kept as it is, for validation to report
 *     - A `null` element at a position whose constraints changed, where the new position declares a `default` and
 *       doesn't allow `null`, is a cleared row, which becomes `undefined` for the defaults to fill
 *     - Where the new position's type, read through `getSchemaType()`, is "object" or "array", or its type list names
 *       "object" or "array", and it isn't a select
 *       over object or array constants (see `isWholeValueSelect()`), retrieve its schemas for that element
 *     - Keep an element that is one of the new position's `enum` or constant options as it is, dropping one that is
 *       none of them other than `undefined`, which stays a hole
 *     - Otherwise, under "object" or "array", an object element whose new schema declares `properties` is recursively
 *       sanitized against them, and any other object element is kept as it is. A value that is not an object, other
 *       than `undefined`, is dropped where the new position declares `type: 'object'`, except a `null` that
 *       `nullable: true` allows. An array element is recursively sanitized against both schemas read as `array`
 *       (see `asArraySchema()`), and kept as it is when that returns
 *       `undefined`. An element that is not an array is kept as it is under "array", as is one that is not an object
 *       under a type list naming object, such as a `null` the list allows
 *     - An element the new position's `const` rejects once sanitized, as below or as a scalar the `const` isn't, takes
 *       the new `const` where it holds the old one, and is dropped otherwise
 *     - Where a dropped element is at a position the new schema's `prefixItems` or tuple describes, the array is
 *       cleared instead, rather than the elements after it moved into positions describing others. An `undefined`
 *       element there stays a hole, and one at a position both sides constrain alike (see `constrainsAlike()`), its
 *       `default` aside, is kept for validation to report
 * - Otherwise return `undefined`, which clears an array the new schema's `enum` or constant options do not list, where
 *   the old schema declared a different list
 * - Last, if the `data` is an object or array and the new `const` isn't the sanitized `data`, or the `data` where that
 *   is `undefined`, and the old schema didn't declare the same `const`, return a copy of the new `const` where the
 *   `data` equals the old one, and `undefined` otherwise
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root JSON schema of the entire form
 * @param [newSchema] - The new schema for which the data is being sanitized
 * @param [oldSchema] - The old schema from which the data originated
 * @param [data={}] - The form data associated with the schema, defaulting to an empty object when undefined
 * @param [fill={}] - What the defaults hand the field holding the data, the same before and after the change, for one
 *        below the root, such as the field an `anyOf`/`oneOf` switch is made in
 * @returns - The new form data, without the fields uniquely associated with the old schema. Will return `undefined` if
 *      the new schema is not an object containing properties, or where its `const` rejects object or array data, and a
 *      copy of that `const` where the data holds the old schema's
 */
export default function sanitizeDataForNewSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  newSchema?: S,
  oldSchema?: S,
  data: unknown = {},
  fill: FieldFill = {},
): T {
  return sanitizeWithFills<T, S, F>(context, rootSchema, newSchema, oldSchema, data, fill, fill);
}

/** `sanitizeDataForNewSchema()` for a value whose field the defaults reached as `oldFill` says before the change and
 * as `newFill` says after it, see `getFilledDefault()`
 */
function sanitizeWithFills<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  newSchema: S | undefined,
  oldSchema: S | undefined,
  data: unknown,
  oldFill: FieldFill,
  newFill: FieldFill,
): T {
  // Data equal to the new `const` is the one value the schema allows, so sanitizing it could only change it into one the
  // `const` rejects. A scalar is left to the rules below
  if (newSchema?.const !== undefined && isContainerValue(data) && deepEquals(newSchema.const, data)) {
    return data as T;
  }
  // By default, we will clear the form data
  let newFormData;
  const newProperties = newSchema?.[PROPERTIES_KEY];
  // If the new schema is of type object and that object contains a list of properties. One whose types leave out
  // `object`, such as a nullable object's `null` option rendered with the object's `properties` (see
  // `getRenderedOptionSchema()`), holds no object to keep them in
  if (newSchema && newProperties && getSchemaOwnTypes<S>(newSchema)?.includes('object') !== false) {
    // An object of the values replacing the data's own. It and `nestedData` are without a prototype, so that a
    // `__proto__` key is written as a plain key, and the spread into `newFormData` copies it as an own one
    const replacements: GenericObjectType = Object.create(null);
    // The keys the old schema declares that the data holds, each removed from the data unless the new schema declares
    // it with the same type. Removed rather than set to `undefined`, which a nested object's field would read as an
    // extra key, and which would keep the defaults from reaching the key
    const discardedKeys = new Set<string>();
    const oldProperties = oldSchema?.[PROPERTIES_KEY];
    if (oldProperties) {
      Object.keys(oldProperties).forEach((key) => {
        if (hasByPath(data, key)) {
          discardedKeys.add(key);
        }
      });
    }
    const keys: string[] = Object.keys(newProperties);
    // Create a place to store nested data that will be a side-effect of the filter
    const nestedData: GenericObjectType = Object.create(null);
    // The keys the data holds as `undefined` that both schemas constrain alike. Any other key left `undefined` is removed,
    // so the new defaults reach it as a top-level clear's do in `formDataForNewOption()`
    const keptClears = new Set<string>();
    // What each side computes for the object, whose keys are the defaults each property inherits
    const oldObjectDefault = oldSchema && getFilledDefault<S, F>(context, oldSchema, oldFill.inheritedDefault);
    const newObjectDefault = getFilledDefault<S, F>(context, newSchema, newFill.inheritedDefault);
    keys.forEach((key) => {
      const oldInherited = getByPath(oldObjectDefault, key);
      const newInherited = getByPath(newObjectDefault, key);
      // Undefined where the object lists no `required`, which the defaults hand its properties apart from `false`
      const isOldRequired = oldSchema?.required?.includes(key);
      const isNewRequired = newSchema.required?.includes(key);
      const oldPlacement: PropertyPlacement = {
        isRequired: isOldRequired ?? false,
        isParentRequired: oldFill.isRequired,
      };
      const newPlacement: PropertyPlacement = {
        isRequired: isNewRequired ?? false,
        isParentRequired: newFill.isRequired,
      };
      const formValue = getByPath(data, key);
      const isNewProperty = !hasByPath(oldSchema, [PROPERTIES_KEY, key]);
      const oldRawKeyedSchema = getPropertySchema<S>(oldSchema, key);
      const newRawKeyedSchema = getPropertySchema<S>(newSchema, key);
      // Resolve refs, dependencies, if/then/else and allOf against the current data, so a dependency nested
      // inside this key (not just at the root schema) is taken into account when sanitizing its data (#5250)
      const oldKeyedSchema = retrieveSchema<unknown, S, F>(context, oldRawKeyedSchema, rootSchema, formValue);
      // The old and new raw schema for a key are usually the same object (most keys aren't touched by whatever
      // changed, and a schema `Form` re-resolves keeps the subschemas that did not change), so skip resolving (and
      // re-running any oneOf/dependency validity checks) a second time in that common case.
      const newKeyedSchema =
        oldRawKeyedSchema === newRawKeyedSchema
          ? oldKeyedSchema
          : retrieveSchema<unknown, S, F>(context, newRawKeyedSchema, rootSchema, formValue);
      /** What the value takes from the new `default` the defaults fill the property with, see `defaultReplacement()` */
      const replacementFor = (isNewClear: boolean, isScalar: boolean) =>
        defaultReplacement<S>(
          newKeyedSchema,
          getFilledDefault<S, F>(context, newKeyedSchema, newInherited, newPlacement),
          getFilledDefault<S, F>(context, oldKeyedSchema, oldInherited, oldPlacement),
          formValue,
          isNewClear,
          isScalar,
        );
      // Now get types and see if they are the same. A type that was guessed from the data of an `additionalProperties`
      // entry the schema puts no constraint on describes what that data was rather than what the schema requires, so
      // it is treated as no type at all: the data changing type is a change of data, not a change of schema. That only
      // holds while both sides are free to hold anything — once the new schema names a type of its own, it is that
      // type the data has to satisfy, so data of the type the old side merely happened to hold is still cleared
      const isUnconstrainedOnBothSides =
        hasSchemaMarker(oldKeyedSchema, GUESSED_TYPE_FLAG) && hasSchemaMarker(newKeyedSchema, GUESSED_TYPE_FLAG);
      const oldSchemaTypeForKey = isUnconstrainedOnBothSides ? undefined : oldKeyedSchema.type;
      const newSchemaTypeForKey = newKeyedSchema.type;
      // Check if the old option has the same key with the same type
      if (!oldSchemaTypeForKey || isSameType(oldSchemaTypeForKey, newSchemaTypeForKey)) {
        discardedKeys.delete(key);
        if (
          formValue === undefined &&
          hasByPath(data, key) &&
          constrainsAlike<S, F>(
            context,
            oldKeyedSchema,
            newKeyedSchema,
            oldInherited,
            newInherited,
            oldPlacement,
            newPlacement,
          )
        ) {
          keptClears.add(key);
        }
        // If it is an object, we'll recurse and store the resulting sanitized data for the key. A select over object or
        // array constants holds one of them as a whole, so it's checked against its options like any other select
        // A container is read by what it holds, as `Form` walks it: an array as an array and a plain object as an object
        // where the type list names that type, whichever type `getSchemaType()` renders the list as, so a `null` a type
        // list allows stays as it is. Only a declared type counts, not one `getSchemaType()` guesses, such as `array`
        // from a typeless `const` array, which has no `items` to sanitize its value against and would be cleared
        const declaredTypes = [newSchemaTypeForKey].flat();
        const isArrayValue = Array.isArray(formValue) && declaredTypes.includes('array');
        // A `null` that `nullable: true` allows stays as it is, as one a type list allows does
        const isAllowedNull = formValue === null && newKeyedSchema.nullable === true;
        const isObjectValue =
          (newSchemaTypeForKey === 'object' && !isAllowedNull) ||
          (isPlainObject(formValue) && declaredTypes.includes('object'));
        // Any select, not only one `isWholeValueSelect()` reads as one, since a type list rendered as a scalar, such as
        // `['string', 'object']`, still holds an object or array it lists as a whole
        const isContainer = (isObjectValue || isArrayValue) && !isConstantSelect<S>(newKeyedSchema);
        if (isContainer && formValue === null) {
          // `null` holds no object, as the Optional Data Controls read it, so it is removed as absent data is left out,
          // for the defaults to fill, rather than replaced by an empty object that shows the object as added, unless it
          // is the old `const` the new one replaces. Only an object schema reaches here with it: a type list or
          // `nullable: true` allowing `null` keeps it as a scalar
          const replacement = constReplacement<S>(newKeyedSchema, oldKeyedSchema, null, null);
          if (replacement === NO_VALUE || replacement === undefined) {
            discardedKeys.add(key);
          } else {
            nestedData[key] = replacement;
          }
        } else if (isContainer) {
          // A container holding the old `default` takes the new one whole, as a scalar does, rather than being
          // sanitized into neither, unless it is an object, whose `default` the defaults fill in key by key
          const defaultValue =
            formValue === undefined || (isObjectValue && getSchemaType<S>(newKeyedSchema) === 'object')
              ? NO_VALUE
              : replacementFor(false, false);
          // SIDE-EFFECT: process the new schema type of object recursively to save iterations. Data holding no object
          // has no properties to sanitize. Descending into it would sanitize the absent properties of every level a
          // recursive `$ref` reaches, without end
          let sanitizedData: unknown;
          if (defaultValue !== NO_VALUE) {
            sanitizedData = defaultValue;
          } else if (isArrayValue) {
            sanitizedData = sanitizeWithFills<T, S, F>(
              context,
              rootSchema,
              asArraySchema<S>(newKeyedSchema),
              asArraySchema<S>(oldKeyedSchema),
              formValue,
              { isRequired: isOldRequired },
              { isRequired: isNewRequired },
            );
          } else {
            sanitizedData = isPlainObject(formValue)
              ? sanitizeWithFills<T, S, F>(
                  context,
                  rootSchema,
                  newKeyedSchema,
                  oldKeyedSchema,
                  formValue,
                  { inheritedDefault: oldInherited, isRequired: isOldRequired },
                  { inheritedDefault: newInherited, isRequired: isNewRequired },
                )
              : emptyObjectFor<S>(newKeyedSchema, formValue);
          }
          // What the new `const` rejects, the empty object standing in for data of another type or the data itself
          // where there is none, takes the new `const` where the data holds the old one, and is otherwise cleared
          const replacement =
            formValue === undefined
              ? NO_VALUE
              : constReplacement<S>(newKeyedSchema, oldKeyedSchema, sanitizedData ?? formValue, formValue);
          const itemData = replacement === NO_VALUE ? sanitizedData : replacement;
          // `undefined` clears an array, and a value the new `const` rejects. For any other object it means the new
          // schema declares no `properties` to sanitize it by, and the object is kept as it is
          if (itemData !== undefined || isArrayValue || replacement !== NO_VALUE) {
            nestedData[key] = itemData;
          }
        } else {
          // Ok, the non-object types match, let's make sure that a default or a const of a different value is replaced
          // with the new default or const. This allows the case where two schemas differ that only by the default/const
          // value to be properly selected
          // A clear the same constraints held stays one, even where the key is new to the new schema's `properties`
          const isNewClear = isNewProperty && formValue === undefined && !keptClears.has(key);
          const replacement = replacementFor(isNewClear, true);
          if (replacement !== NO_VALUE) {
            replacements[key] = replacement;
          }

          const newOptionConst = getByPath(newKeyedSchema, CONST_KEY, NO_VALUE);
          const oldOptionConst = getByPath(oldKeyedSchema, CONST_KEY, NO_VALUE);
          if (newOptionConst !== NO_VALUE && !deepEquals(newOptionConst, formValue)) {
            // Since this is a const, if the old value matches, replace the value with the new const otherwise clear it
            replacements[key] = deepEquals(oldOptionConst, formValue) ? ownValue(newOptionConst) : undefined;
          }

          // A clear the same constraints held stays one, even where the enum offers a `default` or a single option
          if (hasByPath(data, key) && !keptClears.has(key)) {
            const enumReplacement = replacementForInvalidEnumValue(newKeyedSchema, formValue);
            if (enumReplacement !== NO_VALUE) {
              replacements[key] = enumReplacement;
            }
          }
        }
      }
    });
    const sanitized: GenericObjectType = {
      ...(isObject(data) ? data : undefined),
      ...replacements,
      ...nestedData,
    };
    // A value cleared to `undefined` is removed, so the defaults reach the key as they do on mount. A key the data holds
    // as `undefined` is a clear of its own, which stays unless its constraints changed, as a top-level clear gives way
    // to the new option's defaults in `formDataForNewOption()`
    keys.forEach((key) => {
      if (Object.hasOwn(sanitized, key) && sanitized[key] === undefined && !keptClears.has(key)) {
        discardedKeys.add(key);
      }
    });
    discardedKeys.forEach((key) => delete sanitized[key]);
    newFormData = sanitized;
  } else if (
    // Read through `getSchemaType()`, as the field rendering each schema is picked, so an array whose type list also
    // allows `null` keeps its items as a plain array does
    oldSchema &&
    newSchema &&
    // An old schema declaring no type allows any value, so nothing marks an array it held as stale
    (oldSchema.type === undefined || getSchemaType<S>(oldSchema) === 'array') &&
    getSchemaType<S>(newSchema) === 'array' &&
    Array.isArray(data) &&
    // A select over whole arrays holds one of its values, so an array it does not list is cleared as well, unless the
    // old schema listed the same values, for the same reason. Its constant options are read as the property's are
    (replacementForInvalidEnumValue<S>(resolveConstantOptions<S>(newSchema, rootSchema), data) === NO_VALUE ||
      deepEquals(
        oldListedValues<S>(oldSchema, rootSchema),
        enumValuesForSchema<S>(resolveConstantOptions<S>(newSchema, rootSchema)),
      ))
  ) {
    // An old schema declaring no type allows any value, so the types its items declare mark none as stale. Its items are
    // read without them, as the untyped old schema itself is, so that the keys only they declare are still removed
    const oldIsUntyped = oldSchema.type === undefined;
    const withOldType = (schema: S): S => (oldIsUntyped ? { ...schema, type: undefined } : schema);
    /** The old schema of an item, resolved against it as `newItemSchema`, the new one, is */
    const oldItemSchemaOf = (oldRaw: S, newRaw: S, newItemSchema: S, aValue: unknown): S =>
      withOldType(
        oldRaw === newRaw ? newItemSchema : retrieveSchema<unknown, S, F>(context, oldRaw, rootSchema, aValue),
      );
    const newPrefixLength = getPrefixLength<S>(newSchema);
    // The position past the longer prefix stands for every item after both
    const positionCount = Math.max(getPrefixLength<S>(oldSchema), newPrefixLength) + 1;
    // A type guessed from the data describes what the data was rather than a schema, so an array holding it is cleared
    // once the new schema describes its items otherwise
    let isCleared =
      hasSchemaMarker(oldSchema, GUESSED_TYPE_FLAG) &&
      // `additionalItems` describes nothing beside an `items` that is not a tuple, so it only counts beside one
      !(Array.isArray(oldSchema.items) || Array.isArray(newSchema.items) ? TUPLE_KEYWORDS : ITEMS_KEYWORDS).every(
        (key) => deepEquals((oldSchema as GenericObjectType)[key], (newSchema as GenericObjectType)[key]),
      );
    /** Whether a `null` item at `index` is a cleared row, as `Form` reads one: its position's constraints changed, and
     * the new position declares a `default` to fill the row with and doesn't allow `null`. The row is kept empty for
     * the defaults to fill, rather than judged. Every `null` item at a position reads the same schemas, so each
     * position is asked once */
    const clearedRows = new Map<number, boolean>();
    const isClearedRow = (index: number): boolean => {
      const known = clearedRows.get(index);
      if (known !== undefined) {
        return known;
      }
      const newRaw = itemSchemaAt<S>(newSchema, index);
      let cleared = false;
      if (newRaw !== false) {
        const newItem = retrieveSchema<unknown, S, F>(context, newRaw, rootSchema, null);
        if (newItem.default !== undefined) {
          const declaredOldRaw = itemSchemaAt<S>(oldSchema, index);
          const oldRaw = declaredOldRaw === false ? (ANY_ITEM as S) : declaredOldRaw;
          const oldItem = oldItemSchemaOf(oldRaw, newRaw, newItem, null);
          // An untyped old schema's item types mark nothing as stale, so they count as the new one's
          const oldConstraints = oldIsUntyped ? { ...oldItem, type: newItem.type } : oldItem;
          cleared =
            !constrainsAlike<S, F>(context, oldConstraints, newItem, undefined, undefined) &&
            !context.validator.isValid(newItem, null, rootSchema);
        }
      }
      clearedRows.set(index, cleared);
      return cleared;
    };
    /** The schemas of the position at `index`, or `undefined` where the two sides describe it so that an item there is
     * rejected: a prefix item clears the array, and one past the prefix is dropped. Asked only of the positions an item
     * reaches, so data that fits is never cleared by a position it doesn't fill, and no schema is resolved for one */
    const positionAt = (index: number): ItemPosition<S> | undefined => {
      const newRaw = itemSchemaAt<S>(newSchema, index);
      const declaredOldRaw = itemSchemaAt<S>(oldSchema, index);
      if (newRaw === false) {
        // `items: false`, or `additionalItems: false` beside a tuple, allows no item there, which data the old side
        // allowed need not fit
        return declaredOldRaw === false ? false : undefined;
      }
      // An old `false` allowed no item there, so it shaped none the data holds, and constrains nothing, as a position
      // the old schema declares nothing at doesn't
      const oldRaw = declaredOldRaw === false ? (ANY_ITEM as S) : declaredOldRaw;
      // Resolve refs, dependencies, if/then/else and allOf against the current array, not just a direct `$ref`, so the
      // type check below reflects an items schema whose type is only reachable through one of those keywords (#5250).
      // The old and new raw schemas are usually the same object, so it is resolved once in that common case, and an
      // untyped old schema's, whose type is ignored, not at all
      const newItems = retrieveSchema<unknown, S, F>(context, newRaw, rootSchema, data);
      const oldType = oldIsUntyped
        ? undefined
        : (oldRaw === newRaw ? newItems : retrieveSchema<unknown, S, F>(context, oldRaw, rootSchema, data)).type;
      // A new position declaring no type, or every type the old one declares, rejects no item by its type
      if (oldType !== undefined && newItems.type !== undefined && !namesEveryType(oldType, newItems.type)) {
        return undefined;
      }
      // An item a type list allows is read by what it holds, see `sanitizeItem`, so an object one holds is sanitized as
      // an object item is and a `null` it allows stays as it is. An item picked from object constants is one of them as
      // a whole, so it's checked against the options rather than sanitized property by property, which would find no
      // properties and drop it
      const schemaType = newItems.type === undefined ? undefined : getSchemaType<S>(newItems);
      const listedTypes = getKnownTypes<S>(newItems);
      return { newRaw, oldRaw, newItems, schemaType, listedTypes, isWholeSelect: isWholeValueSelect<S>(newItems) };
    };
    /** What `aValue` is sanitized to at `position`, or `NO_VALUE` where it is dropped. A prefix item dropped would move
     * the items after it into positions that describe others, so where `isPrefix` it is `NO_VALUE` only where the array
     * is cleared instead: one its position's old schema constrained alike, as `constrainsAlike()` reads them, already
     * failed it, so it stays for validation to report. An unfilled prefix item never reaches here, see the loop below.
     * A `default` decides no item's validity, so it is left out of that, and an untyped old schema's item types mark
     * nothing as stale, so they count as the new one's */
    const sanitizeItem = (position: ItemPosition<S>, aValue: unknown, isPrefix: boolean): unknown => {
      // A position the new side constrains nothing at, or both sides close, keeps its item as it is, with nothing to
      // resolve per item
      if (!position || position.newRaw === ANY_ITEM) {
        return aValue;
      }
      const { newRaw, oldRaw, newItems, schemaType, listedTypes, isWholeSelect } = position;
      // A type list holds an object item as an object and an array item as an array where it names that type, as `Form`
      // walks them, whichever type `getSchemaType()` renders the list as. Any other item, a hole included, is a scalar,
      // as a hole under `array` items is: `Form` keeps it there, where under `object` items it fills an empty object
      let itemsType = schemaType;
      if (listedTypes.length > 0) {
        const itemType = Array.isArray(aValue) ? 'array' : 'object';
        itemsType =
          (itemType === 'array' || isPlainObject(aValue)) && listedTypes.includes(itemType) ? itemType : undefined;
      } else if (aValue === undefined && schemaType === 'array') {
        itemsType = undefined;
      }
      const isContainer = (itemsType === 'object' || itemsType === 'array') && !isWholeSelect;
      // Resolve refs, dependencies, if/then/else and allOf against this item's own value, so a conditional nested inside
      // `items` picks the branch that matches this element rather than the whole array (#5250), the `const` and options
      // a scalar item is checked by included
      const newItemSchema = retrieveSchema<unknown, S, F>(context, newRaw, rootSchema, aValue);
      // The old item schema, resolved only where something reads it
      let oldItemSchema: S | undefined;
      // An item holding its old `default` takes the new one, as a property does, unless it is an object rendered as
      // `object`, which the defaults fill key by key, though a select over objects holds one whole. Untyped items are
      // filled so only by an object `default`, through their `properties` or an option's, see `rendersProperties()`.
      // `Form` clears no item for a `readOnly` new `default`
      const isFilledByKey =
        schemaType === undefined
          ? isPlainObject(newItemSchema.default) && rendersProperties<S>(newItemSchema)
          : schemaType === 'object';
      if (newItemSchema.default !== undefined && !(isPlainObject(aValue) && !isWholeSelect && isFilledByKey)) {
        oldItemSchema = oldItemSchemaOf(oldRaw, newRaw, newItemSchema, aValue);
        const defaultValue = defaultReplacement<S>(
          newItemSchema,
          newItemSchema.default,
          oldItemSchema.default,
          aValue,
          false,
          false,
        );
        if (defaultValue !== NO_VALUE) {
          return defaultValue;
        }
      }
      let itemValue: unknown;
      const listedValues = enumValuesForSchema<S>(newItemSchema);
      if (listedValues) {
        // An item its options list is one of them as a whole, so it is kept as it is, and one they don't list is
        // dropped, whatever the old schema listed. A hole is no option, and stays one, as `Form` keeps it
        itemValue = aValue === undefined || listedValues.some((value) => deepEquals(value, aValue)) ? aValue : NO_VALUE;
      } else if (!isContainer && newItemSchema.const === undefined) {
        // Only a new `const` can reject a scalar item here
        itemValue = aValue;
      } else {
        // A `null` that `nullable: true` allows stays as it is, as it does for a property, unless the new `const`
        // below rejects it
        const isAllowedNull = aValue === null && newItemSchema.nullable === true;
        const isContainerItem =
          isContainer &&
          !isAllowedNull &&
          (itemsType === 'array' ? Array.isArray(aValue) : newItems.type === 'object' || isPlainObject(aValue));
        let sanitizedItem: unknown = aValue;
        if (isContainerItem && (itemsType === 'array' || newItemSchema[PROPERTIES_KEY])) {
          // `type: 'object'` items can't hold a value that is no object, whatever the old items allowed, so it is
          // dropped rather than given an empty object, a row the user never filled, unless it is the old `const`
          const isObjectless = itemsType === 'object' && aValue !== undefined && !isPlainObject(aValue);
          oldItemSchema ??= oldItemSchemaOf(oldRaw, newRaw, newItemSchema, aValue);
          // An array element the call clears, by an item at a position the new items close or a rejected prefix item,
          // is kept as it is, as `Form` keeps it. A `const` the call rejects is checked again below, which drops the
          // item. An array item is sanitized as an array, see `asArraySchema()`
          const isArrayItem = itemsType === 'array';
          sanitizedItem = isObjectless
            ? undefined
            : (sanitizeWithFills<unknown, S, F>(
                context,
                rootSchema,
                isArrayItem ? asArraySchema<S>(newItemSchema) : newItemSchema,
                isArrayItem ? asArraySchema<S>(oldItemSchema) : oldItemSchema,
                aValue,
                { isRequired: oldFill.isRequired },
                { isRequired: newFill.isRequired },
              ) ?? aValue);
        } else if (isContainerItem) {
          // An object item declaring no `properties` has none to prune, so it is kept as it is
          sanitizedItem = isPlainObject(aValue) ? aValue : undefined;
        }
        // An item the new `const` rejects once sanitized takes it where it holds the old one, and is dropped otherwise.
        // An `undefined` a scalar position holds is a hole the array already has, and stays one
        let replacement: unknown = NO_VALUE;
        if (newItemSchema.const !== undefined && (aValue !== undefined || isContainer)) {
          oldItemSchema ??= oldItemSchemaOf(oldRaw, newRaw, newItemSchema, aValue);
          replacement = itemConstReplacement<S>(newItemSchema, oldItemSchema, sanitizedItem ?? aValue, aValue);
        }
        const value = replacement === NO_VALUE ? sanitizedItem : replacement;
        itemValue = value === undefined && (isContainer || replacement !== NO_VALUE) ? NO_VALUE : value;
      }
      if (itemValue !== NO_VALUE || !isPrefix) {
        return itemValue;
      }
      const oldConstraints = oldItemSchema ?? oldItemSchemaOf(oldRaw, newRaw, newItemSchema, aValue);
      const isAlike = constrainsAlike<S, F>(
        context,
        { ...oldConstraints, type: oldIsUntyped ? newItemSchema.type : oldConstraints.type, default: undefined },
        { ...newItemSchema, default: undefined },
        undefined,
        undefined,
      );
      return isAlike ? aValue : NO_VALUE;
    };
    // An unchanged `maxItems` the data already exceeds was failing it before the change, so it leaves the items past it
    // for validation to report: none of them clears the array, as `Form` keeps it. Only a changed one trims, at `bound`
    const limit = newSchema.maxItems ?? Infinity;
    const bound = oldSchema.maxItems === newSchema.maxItems ? Infinity : limit;
    const sanitizedItems: unknown[] = [];
    // The position at `positionCount - 1` stands for every item after both prefixes, so it is read once
    let position: ItemPosition<S> | undefined = false;
    let positionIndex = -1;
    // A dropped prefix item clears the array, rather than move the items after it into positions describing others.
    // `maxItems` of 0 allows no item at all
    for (let index = 0; !isCleared && index < data.length && sanitizedItems.length < bound; index++) {
      const isPrefix = index < newPrefixLength;
      const at = Math.min(index, positionCount - 1);
      if (isPrefix && data[index] === undefined) {
        // An unfilled prefix item stays a hole whatever its position now declares, so it reaches none. Each prefix
        // index has a position of its own, so the next item still reaches its own
        sanitizedItems.push(undefined);
      } else if (data[index] === null && isClearedRow(at)) {
        sanitizedItems.push(undefined);
      } else {
        if (at !== positionIndex) {
          position = positionAt(at);
          positionIndex = at;
        }
        // An item past the prefix whose position's types differ is dropped, as `Form` drops it, a hole included. One
        // where no item is allowed clears the array, as any item there does
        const itemValue = position === undefined ? NO_VALUE : sanitizeItem(position, data[index], isPrefix);
        const clears = isPrefix || (position === undefined && itemSchemaAt<S>(newSchema, at) === false);
        if (itemValue !== NO_VALUE) {
          sanitizedItems.push(itemValue);
        } else if (clears && index >= limit) {
          sanitizedItems.push(data[index]);
        } else {
          isCleared = clears;
        }
      }
    }
    if (!isCleared) {
      newFormData =
        sanitizedItems.length === data.length && sanitizedItems.every((item, index) => item === data[index])
          ? data
          : sanitizedItems;
    }
  }
  // Checked once sanitized, since removing what only the old schema declared can leave the `const`. Data the new `const`
  // still rejects takes the new `const` where it holds the old one, as a scalar does above, and is otherwise cleared:
  // below the top level, nothing refills a clear
  const replacement =
    newSchema?.const !== undefined && isContainerValue(data)
      ? constReplacement<S>(newSchema, oldSchema, newFormData ?? data, data)
      : NO_VALUE;
  return (replacement === NO_VALUE ? newFormData : replacement) as T;
}
