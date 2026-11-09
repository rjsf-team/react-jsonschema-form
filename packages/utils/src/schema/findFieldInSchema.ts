import { getAdditionalPropertySchema } from '../additionalPropertiesUtils.ts';
import { ADDITIONAL_PROPERTY_FLAG, ITEMS_KEY, PROPERTIES_KEY } from '../constants.ts';
import { renderOption } from '../getRenderedOptionSchema.ts';
import getXxxOfKey from '../getXxxOfKey.ts';
import hasSchemaMarker from '../hasSchemaMarker.ts';
import isObject, { isSchemaObject } from '../isObject.ts';
import { getByPath } from '../pathUtils.ts';
import type {
  FormContextType,
  FoundFieldType,
  RJSFSchema,
  SchemaContext,
  SchemaFieldPath,
  StrictRJSFSchema,
} from '../types.ts';
import findSelectedOptionInXxxOf from './findSelectedOptionInXxxOf.ts';
import getFromSchema from './getFromSchema.ts';
import { AdditionalItemsHandling, getInnerSchemaForArrayItem } from './getInnerSchemaForArrayItem.ts';
import retrieveSchema, { joinOptionExtraKeys } from './retrieveSchema.ts';

const NOT_FOUND = { field: undefined, isRequired: undefined };

/** Returns the schema `holder` declares for `key`. A stub `retrieveSchema()` made for an extra key the data holds is no
 * declaration: it says what the data holds, so a key would otherwise be found differently with the data than without.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param holder - The schema whose `properties` to read
 * @param key - The key to find
 * @returns - The schema `holder` declares for `key`, or undefined if it declares none
 */
function declaredField<S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  holder: S,
  key: string,
): S | undefined {
  const field = getFromSchema<S | undefined, S, F>(context, rootSchema, holder, [PROPERTIES_KEY, key], undefined);
  // `??` since a property YAML leaves empty is `null`, which declares nothing
  return hasSchemaMarker(field, ADDITIONAL_PROPERTY_FLAG) ? undefined : (field ?? undefined);
}

/** Finds the schema of `key` in `parent`. A property `parent` declares comes first, then the array item an index key
 * names, then one of the option rendered for `data` when `parent` has an `anyOf` or `oneOf`, since a form renders both.
 * Only then is `key` an extra key, described by the `patternProperties` and `additionalProperties` of the two together,
 * as the form describes it. An option's field reads the `required` of its parent too, as `getRenderedOptionSchema()`
 * renders it.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param rawParent - The schema in which to find `key`, if there is one
 * @param key - The key to find
 * @param data - The form data of `parent`, used to determine which anyOf/oneOf option is rendered
 * @returns - The schema of `key` and its required state, or `NOT_FOUND`
 */
function findKey<T, S extends StrictRJSFSchema, F extends FormContextType>(
  context: SchemaContext<S, F>,
  rootSchema: S,
  rawParent: S | undefined,
  key: string,
  data: T | undefined,
): FoundFieldType<S> {
  // A boolean subschema has no keys to find, and an empty segment, as the `a.` path leaves, names none
  if (!isSchemaObject<S>(rawParent) || key === '') {
    return NOT_FOUND;
  }
  // Read as the form renders it, with its `$ref`, `allOf` and the `if`/`then` its data meets merged in
  const parent = retrieveSchema<T, S, F>(context, rawParent, rootSchema, data);
  const foundIn = (field: S, ...holders: (S | undefined)[]) => ({
    field,
    isRequired: holders.some((holder) => Array.isArray(holder?.required) && holder.required.includes(key)),
  });
  const own = declaredField<S, F>(context, rootSchema, parent, key);
  if (own !== undefined) {
    return foundIn(own, parent);
  }
  const xxxOfKey = getXxxOfKey<S>(parent);
  const option = xxxOfKey && findSelectedOptionInXxxOf(context, rootSchema, parent, key, xxxOfKey, data);
  // The item the array renders at the index, as the `ui:required` check walks it, its options' `items` met in; an item
  // is never required. Object data holds an extra key there, as a type list naming both `object` and `array` can
  const array = /^\d+$/.test(key) && !isObject(data) && (option ? renderOption<S>(parent, option) : parent);
  if (array && ITEMS_KEY in array) {
    const item = getInnerSchemaForArrayItem<S>(
      array,
      AdditionalItemsHandling.Fallback,
      Array.isArray(array.items) ? Number(key) : -1,
    );
    return { field: getFromSchema<T, S, F>(context, rootSchema, item, [], item), isRequired: false };
  }
  const field = option && declaredField<S, F>(context, rootSchema, option, key);
  if (field !== undefined) {
    return foundIn(field, parent, option);
  }
  const keySchema = getAdditionalPropertySchema<S>(option ? joinOptionExtraKeys<S>(parent, option) : parent, key);
  // `true` is also the answer for a schema with no extra-key keywords, and describes no field either way
  return isSchemaObject<S>(keySchema)
    ? foundIn(retrieveSchema<unknown, S, F>(context, keySchema, rootSchema, getByPath(data, key)), parent, option)
    : NOT_FOUND;
}

/** Finds the field specified by the `path` within the root or recursed `schema`. If there is no field for the specified
 * `path`, then the default `{ field: undefined, isRequired: undefined }` is returned. It determines whether a leaf
 * field is in the `required` list for its parent and if so, it is marked as required on return. At each key of the
 * `path`, a property declared beside an `anyOf` or `oneOf` is found before its options are, and a key no property
 * declares is found through `patternProperties` or `additionalProperties`. An index key finds the item of an array.
 * Each step is read with its `$ref`, `allOf` and the `if`/`then` its data meets merged in.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param schema - The node within the JSON schema in which to search
 * @param path - The keys in the path to the desired field
 * @param [formData] - The form data that is used to determine which anyOf/oneOf option to descend
 * @returns - An object that contains the field and its required state. If no field can be found then
 *            `{ field: undefined, isRequired: undefined }` is returned.
 */
export default function findFieldInSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, rootSchema: S, schema: S, path: SchemaFieldPath, formData?: T): FoundFieldType<S> {
  let parent: S | undefined = schema;
  let found: FoundFieldType<S> = NOT_FOUND;
  let data = formData;
  for (const key of (Array.isArray(path) ? path : path.split('.')).map(String)) {
    found = findKey<T, S, F>(context, rootSchema, parent, key, data);
    parent = found.field;
    data = getByPath<T>(data, key);
  }
  // A copy, since the caller owns its result and `NOT_FOUND` is shared
  return { ...found };
}
