import type { ValidatorErrorTitleSource } from './applyValidatorErrorTitles.ts';
import {
  ADDITIONAL_ITEMS_KEY,
  ADDITIONAL_PROPERTIES_KEY,
  ALL_OF_KEY,
  ANY_OF_KEY,
  DEFINITIONS_KEY,
  DEPENDENCIES_KEY,
  DEPENDENT_SCHEMAS_KEY,
  IF_KEY,
  ITEMS_KEY,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  PREFIX_ITEMS_KEY,
  PROPERTIES_KEY,
  REF_KEY,
} from './constants.ts';
import getFieldSchemaPath from './getFieldSchemaPath.ts';
import getKeywordParentSchema from './getKeywordParentSchema.ts';
import getStaticItemsUiSchema from './getStaticItemsUiSchema.ts';
import getUiOptions from './getUiOptions.ts';
import { isSchemaObject } from './isObject.ts';
import { getByPath, isIndex, propertyToPath } from './pathUtils.ts';
import { getItemSchema } from './schema/getItemSchema.ts';
import type { FormContextType, RJSFSchema, StrictRJSFSchema, UiSchema } from './types.ts';

/** Returns the `schemaPath` with the branches the keyword sits in removed (see `getFieldSchemaPath()`), or the
 * `schemaPath` itself when the root `schema` doesn't lead along it to the keyword. Ajv starts the path of a keyword in a
 * `$ref` target it compiles on its own at that target, so such a path names no field of the root
 *
 * @param schemaPath - The URI fragment of the JSON Pointer to the schema keyword that failed
 * @param decodeSchemaPathKey - Decodes a key of the `schemaPath`
 * @param [schema] - The form's root schema
 * @returns - The path of the keyword in the schema of the field it applies to
 */
export function getErrorFieldSchemaPath<S extends StrictRJSFSchema = RJSFSchema>(
  schemaPath: string,
  decodeSchemaPathKey: (key: string) => string,
  schema?: S,
): string {
  const fieldSchemaPath = getFieldSchemaPath(schemaPath);
  return fieldSchemaPath === schemaPath || !schema || getKeywordParentSchema<S>(schema, schemaPath, decodeSchemaPathKey)
    ? fieldSchemaPath
    : schemaPath;
}

/** The keywords that let a schema declare keys and items it doesn't hold itself */
const OPAQUE_KEYS = [REF_KEY, ALL_OF_KEY, ANY_OF_KEY, ONE_OF_KEY, IF_KEY, DEPENDENCIES_KEY, DEPENDENT_SCHEMAS_KEY];

/** Returns the uiSchema at a data path, an array item's read from its array's `items`, or the tuple's `prefixItems` or
 * `additionalItems` describing it, as `getStaticItemsUiSchema()` reads it, since the uiSchema keys no item by its index. A key that looks like an index is read as the key when the
 * uiSchema holds it or the schema at that point declares it, or, when known, has no items. A key the uiSchema doesn't
 * hold and the known schema doesn't declare is an additional property, read from `additionalProperties`, as the form
 * renders it. A schema holding a `$ref` or a branch isn't known
 *
 * @param uiSchema - The form's uiSchema
 * @param path - The data path, such as `['arr', '0', 'name']`
 * @param [schema] - The form's root schema
 * @returns - The uiSchema at the path, such as `uiSchema.arr.items.name`, otherwise `undefined`
 */
export function uiSchemaAtDataPath<T, S extends StrictRJSFSchema, F extends FormContextType>(
  uiSchema: UiSchema<T, S, F> | undefined,
  path: string[],
  schema?: S,
): UiSchema<T, S, F> | undefined {
  let node = uiSchema;
  let nodeSchema: unknown = schema;
  for (const key of path) {
    // shortcut: the schema is followed through `properties`, items and `additionalProperties` only, not into a `$ref` or
    // a branch, which can declare more keys and items, so past one an undeclared index-like key is guessed to be an item
    // read from `items` and no key is taken for an additional property; resolve the schema if that's needed
    const shown = isSchemaObject<S>(nodeSchema) ? nodeSchema : undefined;
    const isOpaque = !shown || OPAQUE_KEYS.some((keyword) => Object.hasOwn(shown, keyword));
    const holdsKey = Object.hasOwn(Object(node), key);
    const declaresKey = getByPath(shown, [PROPERTIES_KEY, key]) !== undefined;
    const hasItems = getByPath(shown, ITEMS_KEY) !== undefined || getByPath(shown, PREFIX_ITEMS_KEY) !== undefined;
    const isItem = isIndex(key) && !holdsKey && !declaresKey && (isOpaque || hasItems);
    const isAdditional = !isItem && !holdsKey && !declaresKey && !isOpaque;
    if (isItem) {
      node = getStaticItemsUiSchema<T, S, F>(node, Number(key), shown);
      nodeSchema = shown && getItemSchema<S>(shown, Number(key));
    } else {
      node = getByPath<UiSchema<T, S, F> | undefined>(node, isAdditional ? ADDITIONAL_PROPERTIES_KEY : key);
      nodeSchema = getByPath(shown, isAdditional ? ADDITIONAL_PROPERTIES_KEY : [PROPERTIES_KEY, key]);
    }
  }
  return node;
}

/** The keywords whose next key in a schema path names a property, a pattern, a position or a dependency, which could
 * itself be spelled as a keyword. The index after `allOf`, `anyOf` or `oneOf` never is */
const NAMING_KEYS = new Set([
  PROPERTIES_KEY,
  PATTERN_PROPERTIES_KEY,
  PREFIX_ITEMS_KEY,
  DEPENDENCIES_KEY,
  DEPENDENT_SCHEMAS_KEY,
]);
/** The keywords a schema path goes a level down the data through */
const LEVEL_KEYS = new Set([
  PROPERTIES_KEY,
  PATTERN_PROPERTIES_KEY,
  PREFIX_ITEMS_KEY,
  ADDITIONAL_PROPERTIES_KEY,
  ITEMS_KEY,
  ADDITIONAL_ITEMS_KEY,
]);

/** Returns whether each property a schema path names, below the root, is the data path's key at the same level, so
 * the path doesn't lead into another field's uiSchema, as Ajv's path for a keyword behind a `$ref` to another property
 * does, and whether it reaches the data path's level rather than stopping short of it, as Ajv's does for a keyword
 * behind a `$ref` to the root. A path into `definitions` or `$defs` names a definition every `$ref` to it shares, so
 * it is taken as it is
 *
 * @param keys - The decoded keys of the schema path, without its `#` and its keyword
 * @param dataPath - The error's property path
 * @returns - Whether the schema path reaches the data path's level and no property it names differs from its key
 */
function namesNoOtherProperty(keys: string[], dataPath: string[]): boolean {
  let level = 0;
  for (let index = 0; index < keys.length; index += 1) {
    const key = keys[index];
    const next = keys[index + 1] ?? '';
    if (key === DEFINITIONS_KEY || key === '$defs') {
      return true;
    }
    if (key === PROPERTIES_KEY && next !== dataPath[level]) {
      return false;
    }
    if (NAMING_KEYS.has(key) || (key === ITEMS_KEY && isIndex(next))) {
      index += 1;
    }
    if (LEVEL_KEYS.has(key)) {
      level += 1;
    }
  }
  return level === dataPath.length;
}

/** Used by the validator packages to find the `ui:title` of the field an error names: of the `name` under the error's
 * `property`, or of the `property` itself when no `name` is given. It is read at that field's data path, an array
 * item's field under its array's `items`, so `.arr.0.name` reads `uiSchema.arr.items.name`. A `name` with none there
 * has it read along the `schemaPath`, where `#/properties/a/properties/b/required` points into the uiSchema at `['a',
 * 'b']`, then along it with the branches the keyword sits in removed (see `getFieldSchemaPath()`). A schema path that
 * names another property than the data path at the same level, as Ajv's does for a keyword behind a `$ref` to another
 * property, or stops short of the data path, as for one behind a `$ref` to the root, isn't read. An empty `ui:title`
 * is returned as found, and the root's own `ui:title` is never read
 *
 * @param source - The error's `property` and `schemaPath`, the uiSchema they point into and the root schema
 * @returns - The `ui:title` found, otherwise `undefined`
 */
export default function getValidatorErrorUiTitle<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>({
  property,
  name,
  schemaPath,
  decodeSchemaPathKey = (key) => key,
  uiSchema,
  schema,
}: Pick<
  ValidatorErrorTitleSource<T, S, F>,
  'property' | 'schemaPath' | 'decodeSchemaPathKey' | 'uiSchema' | 'schema'
> & {
  /** The name of a property under the `property`, such as one a `required` error names */
  name?: string;
}): string | undefined {
  const propertyPath = propertyToPath(property);
  const dataPath = [...propertyPath, ...(name === undefined ? [] : [name])];
  // The root's own `ui:title` titles the form, not an error on it
  if (dataPath.length === 0) {
    return undefined;
  }
  const { title } = getUiOptions<T, S, F>(uiSchemaAtDataPath<T, S, F>(uiSchema, dataPath, schema));
  if (title !== undefined || name === undefined) {
    return title;
  }
  // The schema path leads to a `ui:title` the data path doesn't: one under `additionalProperties`, an `anyOf` or `oneOf`
  // option's or a definition's. It can lead into another field's uiSchema too, through a `$ref`, so an error other than
  // `required` doesn't read it
  const keysOf = (path: string) => path.split('/').slice(1, -1).map(decodeSchemaPathKey);
  const titleAlong = (path: string) =>
    namesNoOtherProperty(keysOf(path), propertyPath)
      ? getUiOptions<T, S, F>(getByPath(uiSchema, [...keysOf(path.replace(/\/properties\//g, '/')), name])).title
      : undefined;
  return titleAlong(schemaPath) ?? titleAlong(getErrorFieldSchemaPath<S>(schemaPath, decodeSchemaPathKey, schema));
}
