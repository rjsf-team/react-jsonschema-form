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
  JSON_SCHEMA_DRAFT_2019_09,
  JSON_SCHEMA_DRAFT_2020_12,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  PROPERTIES_KEY,
  REF_KEY,
  SCHEMA_KEY,
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
function normalizeUri(uri: string): string {
  return resolveUri('', uri).replace(ENCODED_UNRESERVED, decodeURIComponent);
}

function uriEqual(a: string, b: string): boolean {
  return a === b || normalizeUri(a) === normalizeUri(b);
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
 * entry spelled as a string array drops out. Both walkers below classify through this one helper so their
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

/** Yields the direct subschemas of `schema`, following the keyword shapes above: of a `dependencies` map
 * only the schema values count, since an array value is a list of required property names.
 */
function* subschemas<S extends StrictRJSFSchema = RJSFSchema>(schema: S): Generator<S, void, undefined> {
  for (const [key, value] of Object.entries(schema)) {
    const shape = keywordShape(key, value);
    if (shape === 'map') {
      for (const subSchema of Object.values(value as GenericObjectType)) {
        if (isObject(subSchema)) {
          yield subSchema as S;
        }
      }
    } else if (shape === 'array') {
      for (const subSchema of value as unknown[]) {
        if (isObject(subSchema)) {
          yield subSchema as S;
        }
      }
    } else if (shape === 'single') {
      yield value as S;
    }
  }
}

/** A schema node paired with its lexical base URI: the scope its own `$id` (when present) establishes for the
 * references inside it
 */
interface FoundSchema<S extends StrictRJSFSchema = RJSFSchema> {
  schema: S;
  baseURI: string | undefined;
}

/** The scope a schema node gives its own subtree: its `$id` resolved against the parent scope, or the parent
 * scope unchanged when it has no `$id`
 */
function childScope<S extends StrictRJSFSchema = RJSFSchema>(node: S, parentURI: string): string {
  const id = node[ID_KEY];
  return typeof id === 'string' ? resolveUri(parentURI, id) : parentURI;
}

/** One walk over the schema definitions embedded in a JSON Schema bundle, matching a node whose
 * scope-resolved `$id` equals `ref` - or, when `asWrittenRef` is given, whose `$id` as written equals it
 *
 * @param schema - The schema wherein `ref` should be searched
 * @param ref - The resolved `$id` of the reference to search for
 * @param baseURI - The scope `schema` itself sits in
 * @param asWrittenRef - Optional: also match a node whose `$id` as written equals this string
 * @returns - The matching schema and its scope, or `undefined` if no match is found
 */
function walkEmbeddedSchemas<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  ref: string,
  baseURI = '',
  asWrittenRef?: string,
): FoundSchema<S> | undefined {
  const currentURI = childScope(schema, baseURI);
  if (
    typeof schema[ID_KEY] === 'string' &&
    (uriEqual(currentURI, ref) || (asWrittenRef !== undefined && schema[ID_KEY] === asWrittenRef))
  ) {
    return { schema, baseURI: currentURI };
  }
  for (const subSchema of subschemas(schema)) {
    const result = walkEmbeddedSchemas<S>(subSchema, ref, currentURI, asWrittenRef);
    if (result !== undefined) {
      return result;
    }
  }
  return undefined;
}

/** Looks for the `$id` pointed by `ref` in the schema definitions embedded in a JSON Schema bundle.
 * The scope-resolved match runs first; the as-written match is a separate second pass, so a node whose
 * resolved `$id` is the real match always wins over an earlier node whose raw `$id` only reads the same
 *
 * @param schema - The schema wherein `ref` should be searched
 * @param ref - The resolved `$id` of the reference to search for
 * @param baseURI - The scope `schema` itself sits in
 * @param asWrittenRef - Optional second pass: match a node whose `$id` as written equals this string, so
 *      callers holding an un-resolved nested base URI keep working
 * @returns - The matching schema and its scope, or `undefined` if no match is found
 */
function findEmbeddedSchemaRecursive<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  ref: string,
  baseURI = '',
  asWrittenRef?: string,
): FoundSchema<S> | undefined {
  return (
    walkEmbeddedSchemas<S>(schema, ref, baseURI) ??
    (asWrittenRef !== undefined ? walkEmbeddedSchemas<S>(schema, ref, baseURI, asWrittenRef) : undefined)
  );
}

/** Resolves an RFC 6901 JSON pointer against `node` while tracking the lexical scope: every `$id` on the path
 * re-bases the result, so a pointer that lands on a sub-resource reports that resource's scope, not the outer
 * one. `baseURI` is the scope `node` itself establishes (its own `$id` already applied).
 */
function getByPointerWithScope<S extends StrictRJSFSchema = RJSFSchema>(
  node: S,
  pointer: string,
  baseURI: string | undefined,
): FoundSchema<S> | undefined {
  if (pointer === '') {
    return { schema: node, baseURI };
  }
  if (!pointer.startsWith('/')) {
    return undefined;
  }
  let current: unknown = node;
  let currentScope = baseURI;
  // An `$id` re-bases the walk only when it sits at a schema position: an `$id` inside instance
  // data (`default`, `const`, `enum`, `examples`, ...) names no schema resource, matching what
  // `subschemas()` walks and what `makeAllReferencesAbsolute()` rewrites.
  let currentIsSchema = true;
  let subschemaContainer: 'map' | 'array' | undefined = undefined;
  for (const rawToken of pointer.slice(1).split('/')) {
    const token = rawToken.replaceAll('~1', '/').replaceAll('~0', '~');
    if ((!isObject(current) && !Array.isArray(current)) || !Object.hasOwn(current, token)) {
      return undefined;
    }
    const next = (current as GenericObjectType)[token];
    if (subschemaContainer !== undefined) {
      // Stepping from a subschema map or array into one of its entries: a schema again when it is an object
      currentIsSchema = isObject(next);
      subschemaContainer = undefined;
    } else if (currentIsSchema && isObject(current)) {
      const shape = keywordShape(token, next);
      if (shape === 'map' || shape === 'array') {
        currentIsSchema = false;
        subschemaContainer = shape;
      } else if (shape !== 'single') {
        // A data keyword: everything below it is instance data, never a schema position
        currentIsSchema = false;
      }
    } else {
      currentIsSchema = false;
    }
    current = next;
    if (currentIsSchema && isObject(current) && typeof current[ID_KEY] === 'string') {
      currentScope = resolveUri(currentScope ?? '', current[ID_KEY]);
    }
  }
  return { schema: current as S, baseURI: currentScope };
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
  const visit = (node: S, currentURI: string): S => {
    const ref = node[REF_KEY];
    const refChange = typeof ref === 'string' ? { [REF_KEY]: resolveUri(currentURI, ref) } : undefined;
    return mapSubschemas(node, (subSchema) => visit(subSchema, childScope(subSchema, currentURI)), refChange);
  };
  return visit(schema, typeof schema[ID_KEY] === 'string' ? schema[ID_KEY] : baseURI);
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

/** Given the name of a `$ref` from within a schema, using the `rootSchema`, recursively look up and return the
 * sub-schema using the path provided by that reference. If `#` is not the first character of the reference, the path
 * does not exist in the schema, or the reference resolves circularly back to itself, then throw an Error.
 * Otherwise return the sub-schema. Also deals with nested `$ref`s in the sub-schema.
 *
 * @param $ref - The ref string for which the schema definition is desired
 * @param [rootSchema={}] - The root schema in which to search for the definition
 * @param recurseList - List of $refs already resolved to prevent recursion
 * @param [baseURI=rootSchema['$id']] - The base URI to be used for resolving relative references
 * @returns - The sub-schema within the `rootSchema` which matches the `$ref` if it exists
 * @throws - Error indicating that no schema for that reference could be resolved
 */
export function findSchemaDefinitionWithBaseURI<S extends StrictRJSFSchema = RJSFSchema>(
  $ref?: string,
  rootSchema: S = {} as S,
  recurseList: string[] = [],
  baseURI: string | undefined = rootSchema[ID_KEY],
): FoundSchema<S> {
  const ref = $ref || '';
  const found = lookupSchemaDefinition<S>(ref, rootSchema, baseURI);
  if (found === undefined) {
    throw new Error(`Could not find a definition for ${$ref}.`);
  }
  return resolveFoundChain<S>(found, ref, rootSchema, recurseList, baseURI);
}

/** The lookup half of `findSchemaDefinitionWithBaseURI()`: where `ref` points, and the scope the found
 * node establishes. Returns `undefined` when the ref names nothing, so a caller can try another base
 * without driving the search through exceptions
 */
function lookupSchemaDefinition<S extends StrictRJSFSchema = RJSFSchema>(
  ref: string,
  rootSchema: S,
  baseURI: string | undefined,
): FoundSchema<S> | undefined {
  let found: FoundSchema<S> | undefined = undefined;
  if (ref.startsWith('#')) {
    // Decode URI fragment representation.
    const decodedRef = decodeURIComponent(ref.substring(1));
    if (baseURI === undefined || (ID_KEY in rootSchema && rootSchema[ID_KEY] === baseURI)) {
      // The branch condition already guarantees the root's `$id` IS the base, so it is used as
      // written: resolving it against itself would double the directory part of a relative `$id`.
      const rootScope =
        ID_KEY in rootSchema && typeof rootSchema[ID_KEY] === 'string' ? (baseURI ?? rootSchema[ID_KEY]) : baseURI;
      found = getByPointerWithScope<S>(rootSchema, decodedRef, rootScope);
    } else if (rootSchema[SCHEMA_KEY] === JSON_SCHEMA_DRAFT_2020_12) {
      const resource = findEmbeddedSchemaRecursive<S>(rootSchema, baseURI.replace(/\/$/, ''), '', baseURI);
      if (resource !== undefined) {
        found = getByPointerWithScope<S>(resource.schema, decodedRef, resource.baseURI);
      }
    }
  } else if (rootSchema[SCHEMA_KEY] === JSON_SCHEMA_DRAFT_2020_12) {
    const resolvedRef = baseURI ? resolveUri(baseURI, ref) : ref;
    const [refId, ...refAnchor] = resolvedRef.replace(/#\/?$/, '').split('#');
    const resource = findEmbeddedSchemaRecursive<S>(rootSchema, refId.replace(/\/$/, ''));
    if (resource !== undefined) {
      found =
        refAnchor.length > 0
          ? getByPointerWithScope<S>(resource.schema, decodeURIComponent(refAnchor.join('#')), resource.baseURI)
          : resource;
    }
  }
  return found;
}

/** Follows the `$ref` chain starting at `found`: every link resolves in the scope the previous link
 * reported, and sibling keys next to a `$ref` merge over the resolved target (an `allOf` pair from
 * draft 2019-09 on, where `$ref` may carry siblings with independent meaning)
 */
function resolveFoundChain<S extends StrictRJSFSchema = RJSFSchema>(
  found: FoundSchema<S>,
  ref: string,
  rootSchema: S,
  recurseList: string[],
  baseURI: string | undefined,
): FoundSchema<S> {
  const nextRef = found.schema[REF_KEY];
  if (nextRef) {
    // Check for circular references.
    if (recurseList.includes(nextRef)) {
      if (recurseList.length === 1) {
        throw new Error(`Definition for ${ref} is a circular reference`);
      }
      const [firstRef, ...restRefs] = recurseList;
      const circularPath = [...restRefs, ref, firstRef].join(' -> ');
      throw new Error(`Definition for ${firstRef} contains a circular reference through ${circularPath}`);
    }
    const [remaining] = splitKeyElementFromObject(REF_KEY, found.schema);
    // Bundles rewritten by `makeAllReferencesAbsolute()` carry refs already resolved against the root base
    // rather than the found node's lexical scope, so a next link that names nothing in the lexical scope
    // gets a second lookup against the caller's base. Only the next link's own lookup may fall back: a
    // failure deeper in the chain is a genuinely missing ref and surfaces as the error it is.
    let subFound = lookupSchemaDefinition<S>(nextRef, rootSchema, found.baseURI);
    let subBase = found.baseURI;
    if (subFound === undefined && found.baseURI !== baseURI) {
      subFound = lookupSchemaDefinition<S>(nextRef, rootSchema, baseURI);
      subBase = baseURI;
    }
    if (subFound === undefined) {
      throw new Error(`Could not find a definition for ${nextRef}.`);
    }
    const sub = resolveFoundChain<S>(subFound, nextRef, rootSchema, [...recurseList, ref], subBase);
    if (Object.keys(remaining).length > 0) {
      if (
        rootSchema[SCHEMA_KEY] === JSON_SCHEMA_DRAFT_2019_09 ||
        rootSchema[SCHEMA_KEY] === JSON_SCHEMA_DRAFT_2020_12
      ) {
        return {
          schema: { [ALL_OF_KEY]: [remaining, sub.schema] } as S,
          baseURI: sub.baseURI,
        };
      }
      return { schema: { ...remaining, ...sub.schema }, baseURI: sub.baseURI };
    }
    return sub;
  }
  return found;
}

/** Given the name of a `$ref` from within a schema, using the `rootSchema`, look up and return the sub-schema using the
 * path provided by that reference. If `#` is not the first character of the reference, the path does not exist in
 * the schema, or the reference resolves circularly back to itself, then throw an Error. Otherwise return the
 * sub-schema. Also deals with nested `$ref`s in the sub-schema.
 *
 * @param $ref - The ref string for which the schema definition is desired
 * @param [rootSchema={}] - The root schema in which to search for the definition
 * @param [baseURI=rootSchema['$id']] - The base URI to be used for resolving relative references
 * @returns - The sub-schema within the `rootSchema` which matches the `$ref` if it exists
 * @throws - Error indicating that no schema for that reference could be resolved
 */
export default function findSchemaDefinition<S extends StrictRJSFSchema = RJSFSchema>(
  $ref?: string,
  rootSchema: S = {} as S,
  baseURI: string | undefined = rootSchema[ID_KEY],
): S {
  const recurseList: string[] = [];
  return findSchemaDefinitionRecursive($ref, rootSchema, recurseList, baseURI);
}

/** Given the name of a `$ref` from within a schema, using the `rootSchema`, recursively look up and return the
 * sub-schema using the path provided by that reference. Same lookup as `findSchemaDefinitionWithBaseURI()`,
 * without the resolved base URI.
 *
 * @param $ref - The ref string for which the schema definition is desired
 * @param [rootSchema={}] - The root schema in which to search for the definition
 * @param recurseList - List of $refs already resolved to prevent recursion
 * @param [baseURI=rootSchema['$id']] - The base URI to be used for resolving relative references
 * @returns - The sub-schema within the `rootSchema` which matches the `$ref` if it exists
 * @throws - Error indicating that no schema for that reference could be resolved
 */
export function findSchemaDefinitionRecursive<S extends StrictRJSFSchema = RJSFSchema>(
  $ref?: string,
  rootSchema: S = {} as S,
  recurseList: string[] = [],
  baseURI: string | undefined = rootSchema[ID_KEY],
): S {
  return findSchemaDefinitionWithBaseURI($ref, rootSchema, recurseList, baseURI).schema;
}
