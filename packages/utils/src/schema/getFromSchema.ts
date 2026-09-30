import { REF_KEY } from '../constants.ts';
import { getByPath, hasByPath, toPath } from '../pathUtils.ts';
import type { FormContextType, RJSFSchema, SchemaContext, SchemaFieldPath, StrictRJSFSchema } from '../types.ts';
import retrieveSchema from './retrieveSchema.ts';

/** Internal helper function that acts like `getByPath` but additionally retrieves `$ref`s as needed to get the path
 * for schemas containing potentially nested `$ref`s.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param schema - The current node within the JSON schema recursion
 * @param path - The remaining keys in the path to the desired property
 * @returns - The internal schema from the `schema` for the given `path` or undefined if not found
 */
function getFromSchemaInternal<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: Readonly<SchemaContext<S, F>>, rootSchema: S, schema: S, path: SchemaFieldPath): T | S | undefined {
  let fieldSchema = schema;
  // hasByPath instead of `in` because `schema` can be undefined at runtime when drilling past a non-matching xxxOf
  if (hasByPath(schema, REF_KEY)) {
    fieldSchema = retrieveSchema<T, S, F>(context, schema, rootSchema);
  }
  if (path.length === 0) {
    return fieldSchema;
  }
  const pathList = Array.isArray(path) ? [...path] : toPath(path);
  const [part, ...nestedPath] = pathList;
  if (part !== undefined && part !== '' && hasByPath(fieldSchema, part)) {
    fieldSchema = getByPath<S>(fieldSchema, part);
    return getFromSchemaInternal<T, S, F>(context, rootSchema, fieldSchema, nestedPath);
  }
  return undefined;
}

/** Helper that acts like `getByPath` but additionally retrieves `$ref`s as needed to get the path for schemas
 * containing potentially nested `$ref`s.
 *
 * @param context - The `SchemaContext` that will be forwarded to all the APIs
 * @param rootSchema - The root schema that will be forwarded to all the APIs
 * @param schema - The current node within the JSON schema recursion
 * @param path - The keys in the path to the desired field
 * @param defaultValue - The value to return if a value is not found for the `pathList` path
 * @returns - The inner schema from the `schema` for the given `path` or the `defaultValue` if not found
 */
export default function getFromSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: Readonly<SchemaContext<S, F>>, rootSchema: S, schema: S, path: SchemaFieldPath, defaultValue: T): T;
// `_T` keeps this overload's arity equal to the first one's, so explicit `<T, S, F>` type arguments can still reach it
export default function getFromSchema<
  _T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: Readonly<SchemaContext<S, F>>, rootSchema: S, schema: S, path: SchemaFieldPath, defaultValue: S): S;
export default function getFromSchema<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: Readonly<SchemaContext<S, F>>, rootSchema: S, schema: S, path: SchemaFieldPath, defaultValue: T | S): T | S {
  const result = getFromSchemaInternal<T, S, F>(context, rootSchema, schema, path);
  if (result === undefined) {
    return defaultValue;
  }
  return result;
}
