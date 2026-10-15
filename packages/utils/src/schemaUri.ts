import {
  ADDITIONAL_PROPERTIES_KEY,
  ALL_OF_KEY,
  ANY_OF_KEY,
  DEFINITIONS_KEY,
  DEPENDENCIES_KEY,
  ELSE_KEY,
  ID_KEY,
  IF_KEY,
  ITEMS_KEY,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  PROPERTIES_KEY,
  REF_KEY,
  THEN_KEY,
  UNEVALUATED_PROPERTIES_KEY,
} from './constants.ts';
import isObject from './isObject.ts';
import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** RFC 3986 §5.1.4 lets an implementation assume a default base URI when a schema has none; `createSchemaUtils()`
 * passes `'#'` for a root without `$id`, and nested `$id`s are relative URI-references (2020-12 §8.2.1). The `URL`
 * parser only resolves against an absolute base, so relative bases are resolved against this synthetic one, which is
 * then stripped back off; absolute bases pass through it unchanged. The scheme is deliberately not one of the `URL`
 * spec's "special" schemes, which would additionally rewrite `\` as `/` in every path they touch.
 */
const SYNTHETIC_PROTOCOL = 'rjsf-base:';
const SYNTHETIC_HOST = 'rjsf.invalid';
const SYNTHETIC_ORIGIN = `${SYNTHETIC_PROTOCOL}//${SYNTHETIC_HOST}`;
const SYNTHETIC_BASE = `${SYNTHETIC_ORIGIN}/`;

/** Percent-encoded unreserved characters (RFC 3986 §6.2.2.2: `ALPHA / DIGIT / "-" / "." / "_" / "~"`) */
const ENCODED_UNRESERVED = /%(?:2[de]|5f|7e|3\d|4[1-9a-f]|5[0-9a]|6[1-9a-f]|7[0-9a])/gi;

/** Resolves `ref` against `base`, returning `ref` as written for a base the parser rejects (e.g. an opaque `urn:` base
 * with a relative-path ref), so lookups keep working instead of throwing. What the synthetic base contributed is read
 * off the parsed result: a real scheme means the base was absolute; the synthetic scheme with another host means the
 * base or the ref was a network-path reference, which keeps its `//host` and loses only the scheme; the synthetic host
 * means both were paths, which stay rooted when either started with `/` and relative otherwise
 */
export function resolveUri(base: string, ref: string): string {
  try {
    const resolved = new URL(ref, new URL(base, SYNTHETIC_BASE));
    if (resolved.protocol !== SYNTHETIC_PROTOCOL) {
      // A non-special scheme keeps its host as written, but RFC 3986 §6.2.2.1 makes the host case-insensitive
      resolved.hostname = resolved.hostname.toLowerCase();
      return resolved.href;
    }
    if (resolved.host !== SYNTHETIC_HOST) {
      // A non-special scheme keeps its host as written, but RFC 3986 §6.2.2.1 makes the host case-insensitive
      resolved.hostname = resolved.hostname.toLowerCase();
      return resolved.href.slice(SYNTHETIC_PROTOCOL.length);
    }
    const rooted = ref.startsWith('/') || base.startsWith('/');
    return resolved.href.slice(rooted ? SYNTHETIC_ORIGIN.length : SYNTHETIC_BASE.length);
  } catch {
    return ref;
  }
}

/** Normalizes a URI for comparison: scheme and host case, default port, dot segments and percent-encoded unreserved
 * characters
 */
export function normalizeUri(uri: string): string {
  return resolveUri('', uri).replace(ENCODED_UNRESERVED, decodeURIComponent);
}

/** The keywords through which a schema walk recurses, by the shape of the keyword's value: a single
 * subschema, an array of subschemas, or a map of names to subschemas (whose names are data, so a property
 * named `default` or `enum` is never mistaken for the keyword). Every other keyword - the data keywords
 * `const`, `default`, `enum` and `examples`, annotations like `title`, and vendor or unknown keywords -
 * holds instance data rather than schemas, so its value passes through the walk untouched.
 */
const SUBSCHEMA_KEYWORDS = new Set([
  ITEMS_KEY,
  'additionalItems',
  ADDITIONAL_PROPERTIES_KEY,
  'contains',
  'propertyNames',
  'not',
  IF_KEY,
  THEN_KEY,
  ELSE_KEY,
  'unevaluatedItems',
  UNEVALUATED_PROPERTIES_KEY,
  'contentSchema',
]);
const SUBSCHEMA_ARRAY_KEYWORDS = new Set(['prefixItems', ALL_OF_KEY, ANY_OF_KEY, ONE_OF_KEY, ITEMS_KEY]);
const SUBSCHEMA_MAP_KEYWORDS = new Set([
  PROPERTIES_KEY,
  PATTERN_PROPERTIES_KEY,
  '$defs',
  DEFINITIONS_KEY,
  'dependentSchemas',
  DEPENDENCIES_KEY,
]);

/** Whether `key` is a keyword holding subschemas in one of the shapes above, read from the keyword alone, so that a
 * boolean subschema, which no shape is told apart by, is still read as one
 */
export function isSubschemaKeyword(key: string): boolean {
  return SUBSCHEMA_KEYWORDS.has(key) || SUBSCHEMA_ARRAY_KEYWORDS.has(key) || SUBSCHEMA_MAP_KEYWORDS.has(key);
}

/** Classifies one of a schema's own entries by the shape of the subschema(s) its keyword's value holds: a
 * `map`, an `array`, or a `single` subschema. A draft-7 tuple `items` sits in both the single set and the
 * array set, and the `Array.isArray`/`isObject` checks tell them apart, the same way a `dependencies`
 * entry spelled as a string array drops out. Every schema walk classifies through this one helper so their
 * keyword handling cannot drift apart.
 */
export function keywordShape(key: string, value: unknown): 'map' | 'array' | 'single' | undefined {
  if (SUBSCHEMA_MAP_KEYWORDS.has(key) && isObject(value)) {
    return 'map';
  }
  if (SUBSCHEMA_ARRAY_KEYWORDS.has(key) && Array.isArray(value)) {
    return 'array';
  }
  if (SUBSCHEMA_KEYWORDS.has(key) && isObject(value)) {
    return 'single';
  }
  return undefined;
}

/** Applies `fn` to the direct subschemas of `schema` (following the keyword shapes above), rebuilding only
 * the containers whose contents changed. `extraChanges` carries updates to the schema's own data keys,
 * included in the same rebuild. When neither a subschema nor an extra change differs,
 * `schema` itself is returned, so identity means nothing changed. The rebuild spreads the original node and
 * overwrites only the changed keys, so symbol keys (such as the rjsf flag Symbols) survive it.
 */
function mapSubschemas<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  fn: (subSchema: S) => S,
  extraChanges?: GenericObjectType,
): S {
  const changed: GenericObjectType = {};
  let anyChanged = false;
  const apply = (key: string, next: unknown) => {
    if (next !== (schema as unknown as GenericObjectType)[key]) {
      changed[key] = next;
      anyChanged = true;
    }
  };
  for (const [key, value] of Object.entries(schema)) {
    const shape = keywordShape(key, value);
    if (shape === 'map') {
      let mapped: GenericObjectType | undefined;
      for (const [name, subSchema] of Object.entries(value as GenericObjectType)) {
        const nextSubSchema = isObject(subSchema) ? fn(subSchema as S) : subSchema;
        if (nextSubSchema !== subSchema) {
          mapped = mapped ?? { ...(value as GenericObjectType) };
          mapped[name] = nextSubSchema;
        }
      }
      if (mapped !== undefined) {
        apply(key, mapped);
      }
    } else if (shape === 'array') {
      let mapped: unknown[] | undefined;
      (value as unknown[]).forEach((subSchema, index) => {
        const nextSubSchema = isObject(subSchema) ? fn(subSchema as S) : subSchema;
        if (nextSubSchema !== subSchema) {
          mapped = mapped ?? [...(value as unknown[])];
          mapped[index] = nextSubSchema;
        }
      });
      if (mapped !== undefined) {
        apply(key, mapped);
      }
    } else if (shape === 'single') {
      apply(key, fn(value as S));
    }
  }
  for (const [key, next] of Object.entries(extraChanges ?? {})) {
    apply(key, next);
  }
  return anyChanged ? { ...schema, ...changed } : schema;
}

/** Parses a JSONSchema and makes all references absolute with respect to
 * the `baseURI` argument. The walk follows the schema-valued keywords (see the keyword sets above): only a
 * string `$ref` is a reference to resolve, and only a string `$id` re-bases its subtree.
 *
 * @param schema - The schema to be processed
 * @param baseURI - The base URI to be used for resolving relative references
 */
export function makeAllReferencesAbsolute<S extends StrictRJSFSchema = RJSFSchema>(schema: S, baseURI: string): S {
  const schemaId = schema[ID_KEY];
  const currentURI = typeof schemaId === 'string' ? resolveUri(baseURI, schemaId) : baseURI;
  const ref = schema[REF_KEY];
  // The mapped subschemas never touch the `$ref` data key, so its rewrite is computed up front and
  // passed to the rebuild as `extraChanges`.
  const refChange = typeof ref === 'string' ? { [REF_KEY]: resolveUri(currentURI, ref) } : undefined;
  return mapSubschemas(schema, (subSchema) => makeAllReferencesAbsolute(subSchema, currentURI), refChange);
}

/** Splits out the value at the `key` in `object` from the `object`, returning an array that contains in the first
 * location, the `object` minus the `key: value` and in the second location the `value`.
 *
 * @param key - The key from the object to extract
 * @param object - The object from which to extract the element
 * @returns - An array with the first value being the object minus the `key` element and the second element being the
 *      value from `object[key]`
 */
export function splitKeyElementFromObject(key: string, object: GenericObjectType): [GenericObjectType, unknown] {
  const { [key]: value, ...remaining } = object;
  return [remaining, value];
}
