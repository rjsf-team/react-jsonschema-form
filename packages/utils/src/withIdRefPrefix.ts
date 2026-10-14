import { REF_KEY, ROOT_SCHEMA_PREFIX } from './constants.ts';
import { resolveUri } from './findSchemaDefinition.ts';
import isObject from './isObject.ts';
import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Takes a `node` object and transforms any contained `$ref` node variables with a prefix, recursively calling
 * `withIdRefPrefix` for any other elements.
 *
 * @param node - The object node to which a ROOT_SCHEMA_PREFIX is added when a REF_KEY is part of it
 */
function withIdRefPrefixObject<S extends StrictRJSFSchema = RJSFSchema>(node: S, base: string): S {
  const realObj: GenericObjectType = node;
  for (const key in realObj) {
    /* v8 ignore next -- spread in caller guarantees only own properties reach this loop */
    if (Object.hasOwn(realObj, key)) {
      const value = realObj[key];
      if (key === REF_KEY && typeof value === 'string' && value.startsWith('#')) {
        realObj[key] = ROOT_SCHEMA_PREFIX + value;
      } else if (
        key === REF_KEY &&
        typeof value === 'string' &&
        value !== '' &&
        !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value) &&
        !value.startsWith('//')
      ) {
        // A ref the normalization spelled relative to the root's base resolves against the id the root is
        // registered under, no matter what base the schema being compiled carries
        realObj[key] = resolveUri(base, value);
      } else {
        realObj[key] = withIdRefPrefix<S>(value, base);
      }
    }
  }
  return node;
}

/** Takes a `node` object list and transforms any contained `$ref` node variables with a prefix, recursively calling
 * `withIdRefPrefix` for any other elements.
 *
 * @param node - The list of object nodes to which a ROOT_SCHEMA_PREFIX is added when a REF_KEY is part of it
 */
function withIdRefPrefixArray<S extends StrictRJSFSchema = RJSFSchema>(node: S[], base: string): S[] {
  return node.map((item) => withIdRefPrefix<S>(item, base));
}

/** Recursively prefixes all `$ref`s in a schema with the value of the `ROOT_SCHEMA_PREFIX` constant.
 * This is used in isValid to make references to the rootSchema
 *
 * @param schemaNode - The object node to which a ROOT_SCHEMA_PREFIX is added when a REF_KEY is part of it
 * @returns - A copy of the `schemaNode` with updated `$ref`s
 */
export default function withIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(schemaNode: S[], base?: string): S[];
export default function withIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(schemaNode: S, base?: string): S;
export default function withIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(
  schemaNode: S[keyof S],
  base?: string,
): S[keyof S];
export default function withIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(
  schemaNode: S | S[] | S[keyof S],
  base?: string,
): S | S[] | S[keyof S];
export default function withIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(
  schemaNode: S | S[] | S[keyof S],
  base: string = ROOT_SCHEMA_PREFIX,
): S | S[] | S[keyof S] {
  if (Array.isArray(schemaNode)) {
    return withIdRefPrefixArray<S>([...schemaNode], base);
  }
  if (isObject(schemaNode)) {
    return withIdRefPrefixObject<S>({ ...schemaNode }, base);
  }
  return schemaNode;
}
