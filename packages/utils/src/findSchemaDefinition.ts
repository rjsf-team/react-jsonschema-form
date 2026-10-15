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
import { getByPath } from './pathUtils.ts';
import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Splits an RFC 6901 JSON pointer into its reference tokens: the empty pointer has none, every other pointer is a
 * `/`-led list of them with `~1` and `~0` unescaped in that order. A pointer without the leading `/` is not a JSON
 * pointer, so it has no tokens to follow.
 */
function pointerTokens(pointer: string): string[] | undefined {
  if (pointer === '') {
    return [];
  }
  if (!pointer.startsWith('/')) {
    return undefined;
  }
  return pointer
    .slice(1)
    .split('/')
    .map((token) => token.replaceAll('~1', '/').replaceAll('~0', '~'));
}

/** Resolves the reference `tokens` of a JSON pointer against `obj`: no tokens is `obj` itself. Through `getByPath()`
 * only own properties resolve, so `/__proto__` finds nothing rather than `Object.prototype`, unless it is a genuine
 * own data key.
 */
function getByPointerTokens<R>(obj: R, tokens: string[]): R | undefined {
  if (tokens.length === 0) {
    return obj;
  }
  return getByPath<R>(obj, tokens);
}

/** The `$id` of `schema` when it starts a resource. A fragment-only `$id` is a draft-07 plain-name anchor, which names
 * a location in its resource rather than starting one. Every walk that rebases on an `$id` reads it through this.
 */
function resourceId(schema: GenericObjectType): string | undefined {
  const id: unknown = schema[ID_KEY];
  return typeof id === 'string' && !id.startsWith('#') ? id : undefined;
}

/** Rebases `baseURI` on the `$id` of `schema` when it starts a resource */
function rebasedOn(baseURI: string | undefined, schema: GenericObjectType): string | undefined {
  const id = resourceId(schema);
  return id === undefined ? baseURI : resolveUri(baseURI ?? '', id);
}

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

/** Resolves `ref` against `base`, returning the URI normalized but for its percent-encoded unreserved characters. A
 * base the parser rejects (e.g. an opaque `urn:` base with a relative-path ref) has no path the ref can resolve
 * against, so the ref stays relative, normalized as it would be against no base at all, and lookups keep working
 * instead of throwing. What the synthetic base contributed is read
 * off the parsed result: a real scheme means the base was absolute; the synthetic scheme with another host means the
 * base or the ref was a network-path reference, which keeps its `//host` and loses only the scheme; the synthetic host
 * means both were paths, which stay rooted when either started with `/` and relative otherwise
 */
function resolveUri(base: string, ref: string): string {
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
    // Against no base, only the ref itself can be what the parser rejects, so this recursion ends
    return base === '' ? ref : resolveUri('', ref);
  }
}

/** Normalizes a URI for comparison: scheme and host case, default port, dot segments and percent-encoded unreserved
 * characters
 */
function normalizeUri(uri: string): string {
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

/** The forms of a resource URI a `$ref` to it matches: the URI itself and, as a `$ref` written with a trailing `/`
 * has always matched the `$id` without one, the URI without it. An empty fragment is dropped, as it is from each
 * `$id`, since the base found for an `$id` that ends in one keeps it and is looked up again. Normalized, so each `$id`
 * is compared once.
 */
function refTargets(ref: string): Set<string> {
  const uri = ref.replace(/#$/, '');
  return new Set([normalizeUri(uri), normalizeUri(uri.replace(/\/$/, ''))]);
}

/** Looks for the schema whose `$id` is `ref` among those embedded in a JSON Schema bundle. A nested `$id` may be
 * relative (2020-12 §8.2.1), so each one is resolved against the `$id` of the resource it is nested in before it is
 * compared. An `$id` with an empty fragment, as draft-07 schemas often write one, names the resource itself.
 *
 * @param schema - The schema wherein `ref` should be searched
 * @param ref - The resolved URI of the resource to search for
 * @param [baseURI=''] - The resolved `$id` of the resource `schema` is nested in
 * @param [targets=refTargets(ref)] - The normalized forms of `ref` an `$id` matches
 * @returns - The schema matching the reference and its resolved `$id`, or `undefined` if no match is found
 */
function findEmbeddedSchemaRecursive<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  ref: string,
  baseURI = '',
  targets = refTargets(ref),
): [S, string] | undefined {
  const schemaId = resourceId(schema);
  let currentURI = baseURI;
  if (schemaId !== undefined) {
    currentURI = resolveUri(baseURI, schemaId);
    // `resolveUri()` has already normalized everything but the percent-encoded unreserved characters
    const candidateURI = currentURI.replace(/#$/, '').replace(ENCODED_UNRESERVED, decodeURIComponent);
    if (targets.has(candidateURI)) {
      return [schema, currentURI];
    }
  }
  for (const subSchema of subschemas(schema)) {
    const result = findEmbeddedSchemaRecursive<S>(subSchema, ref, currentURI, targets);
    if (result !== undefined) {
      return result;
    }
  }
  return undefined;
}

/** Returns the base a relative `$ref` in the schema a JSON pointer's `tokens` name inside `resource` resolves against:
 * the resource's own `baseURI`, rebased on each `$id` the pointer passes through or ends on at a schema position. An
 * `$id` under a keyword that holds no subschemas is data rather than an identifier, as the walks above read it, and a
 * fragment-only `$id` is a draft-07 plain-name anchor, so neither starts a resource.
 */
function baseAlongPointer(resource: unknown, tokens: string[], baseURI: string | undefined): string | undefined {
  let base = baseURI;
  let node = resource;
  // Whether `node` is a schema, a map or array of subschemas, or data no keyword reads as schemas
  let position: 'schema' | 'container' | 'data' = 'schema';
  // Only called with tokens `getByPointerTokens()` resolved, so every one names an own property
  for (const token of tokens) {
    const next = getByPath(node, token);
    if (position === 'container') {
      position = 'schema';
    } else if (position === 'schema') {
      const shape = keywordShape(token, next);
      if (shape === undefined) {
        position = 'data';
      } else {
        position = shape === 'single' ? 'schema' : 'container';
      }
    }
    if (position === 'schema' && isObject(next)) {
      base = rebasedOn(base, next);
    }
    node = next;
  }
  return base;
}

/** Returns the base the `$ref` of `schema` and the keywords beside it resolve against: `baseURI`, rebased on the
 * schema's own `$id` in a 2020-12 bundle, the only kind of root in which a lookup finds a resource by its `$id`. The
 * walk that met `schema` cannot tell whether it sits at a schema position, and an `$id` under a keyword that holds no
 * subschemas, such as `components`, is data that no lookup finds, so the base only moves to an `$id` a lookup finds.
 *
 * @param schema - The schema whose `$ref` is being resolved
 * @param rootSchema - The root schema the `$ref` is looked up in
 * @param [baseURI=rootSchema['$id']] - The base of the resource `schema` sits in
 * @returns - The base the `$ref` of `schema` and the keywords beside it resolve against
 */
export function ownBaseURI<S extends StrictRJSFSchema = RJSFSchema>(
  schema: GenericObjectType,
  rootSchema: S,
  baseURI: string | undefined = rootSchema[ID_KEY],
): string | undefined {
  const ownURI = rootSchema[SCHEMA_KEY] === JSON_SCHEMA_DRAFT_2020_12 ? rebasedOn(baseURI, schema) : baseURI;
  if (ownURI === baseURI || ownURI === undefined) {
    return baseURI;
  }
  return findEmbeddedSchemaRecursive(rootSchema, ownURI) === undefined ? baseURI : ownURI;
}

/** Looks up a `$ref` that names a resource embedded in a JSON Schema bundle, resolved to `resolvedRef`, along with
 * the base a relative `$ref` in the definition it found resolves against
 */
function findEmbeddedDefinition<S extends StrictRJSFSchema = RJSFSchema>(
  rootSchema: S,
  resolvedRef: string,
): [S, string | undefined] | undefined {
  const [refId, ...refAnchor] = resolvedRef.replace(/#\/?$/, '').split('#');
  const found = findEmbeddedSchemaRecursive<S>(rootSchema, refId);
  if (found === undefined || refAnchor.length === 0) {
    return found;
  }
  const tokens = pointerTokens(decodeURIComponent(refAnchor.join('#')));
  if (tokens === undefined) {
    return undefined;
  }
  const definition = getByPointerTokens(found[0], tokens);
  return definition === undefined ? undefined : [definition, baseAlongPointer(found[0], tokens, found[1])];
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
  const schemaId = resourceId(schema);
  const currentURI = schemaId === undefined ? baseURI : resolveUri(baseURI, schemaId);
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

/** The same `$ref` written in two resources names two definitions, so the circular reference check compares each
 * one resolved against the base it was met under
 */
function refKey(ref: string, baseURI: string | undefined) {
  return baseURI === undefined ? ref : resolveUri(baseURI, ref);
}

/** Given the name of a `$ref` from within a schema, using the `rootSchema`, recursively look up and return the
 * sub-schema using the path provided by that reference, along with the base URI of the resource the sub-schema was
 * found in, which any relative `$ref` inside it resolves against. If `#` is not the first character of the reference,
 * the path does not exist in the schema, or the reference resolves circularly back to itself, then throw an Error.
 * Otherwise return the sub-schema. Also deals with nested `$ref`s in the sub-schema.
 *
 * @param $ref - The ref string for which the schema definition is desired
 * @param [rootSchema={}] - The root schema in which to search for the definition
 * @param recurseList - List of $refs already resolved to prevent recursion
 * @param [baseURI=rootSchema['$id']] - The base URI to be used for resolving relative references
 * @param [recurseKeys] - The entries of `recurseList`, each resolved against the base it was met under, which is
 *      what the circular reference check compares; by default each is resolved against `baseURI`
 * @returns - The sub-schema within the `rootSchema` which matches the `$ref` if it exists, and the base URI of the
 *      resource it was found in
 * @throws - Error indicating that no schema for that reference could be resolved
 */
export function findSchemaDefinitionWithBase<S extends StrictRJSFSchema = RJSFSchema>(
  $ref?: string,
  rootSchema: S = {} as S,
  recurseList: string[] = [],
  baseURI: string | undefined = rootSchema[ID_KEY],
  recurseKeys: string[] = recurseList.map((listedRef) => refKey(listedRef, baseURI)),
): [S, string | undefined] {
  const ref = $ref || '';
  const isBundle = rootSchema[SCHEMA_KEY] === JSON_SCHEMA_DRAFT_2020_12;
  let found: [S, string | undefined] | undefined;
  if (ref.startsWith('#')) {
    // Decode URI fragment representation.
    const decodedRef = decodeURIComponent(ref.substring(1));
    let resource: [S, string | undefined] | undefined;
    if (baseURI === undefined || (ID_KEY in rootSchema && rootSchema[ID_KEY] === baseURI)) {
      resource = [rootSchema, baseURI];
    } else if (isBundle) {
      resource = findEmbeddedSchemaRecursive<S>(rootSchema, baseURI);
    }
    const tokens = pointerTokens(decodedRef);
    if (resource !== undefined && tokens !== undefined) {
      const definition = getByPointerTokens(resource[0], tokens);
      if (definition !== undefined) {
        // Only a 2020-12 bundle looks a base up again, so only there does a pointer into an embedded resource rebase
        found = [definition, isBundle ? baseAlongPointer(resource[0], tokens, resource[1]) : baseURI];
      }
    }
  } else if (isBundle) {
    const resolvedRef = baseURI ? resolveUri(baseURI, ref) : ref;
    found = findEmbeddedDefinition<S>(rootSchema, resolvedRef);
    if (found === undefined && resolvedRef !== ref) {
      // `createSchemaUtils()` resolves every `$ref` against the base of its resource up front. Under a root without an
      // absolute `$id` the result is still relative, and resolving it a second time repeats the base's path
      found = findEmbeddedDefinition<S>(rootSchema, ref);
    }
  }
  if (found === undefined) {
    throw new Error(`Could not find a definition for ${$ref}.`);
  }
  const [current, currentBaseURI] = found;
  const nextRef = current[REF_KEY];
  if (nextRef) {
    // Check for circular references.
    if (recurseKeys.includes(refKey(nextRef, currentBaseURI))) {
      if (recurseList.length === 1) {
        throw new Error(`Definition for ${$ref} is a circular reference`);
      }
      const [firstRef, ...restRefs] = recurseList;
      const circularPath = [...restRefs, ref, firstRef].join(' -> ');
      throw new Error(`Definition for ${firstRef} contains a circular reference through ${circularPath}`);
    }
    const [remaining] = splitKeyElementFromObject(REF_KEY, current);
    const [subSchema, subBaseURI] = findSchemaDefinitionWithBase<S>(
      nextRef,
      rootSchema,
      [...recurseList, ref],
      currentBaseURI,
      [...recurseKeys, refKey(ref, baseURI)],
    );
    if (Object.keys(remaining).length > 0) {
      if (isBundle || rootSchema[SCHEMA_KEY] === JSON_SCHEMA_DRAFT_2019_09) {
        return [{ [ALL_OF_KEY]: [remaining, subSchema] } as S, subBaseURI];
      }
      return [{ ...remaining, ...subSchema }, subBaseURI];
    }
    return [subSchema, subBaseURI];
  }
  return [current, currentBaseURI];
}

/** `findSchemaDefinitionWithBase()` without the base URI of the resource the sub-schema was found in */
export function findSchemaDefinitionRecursive<S extends StrictRJSFSchema = RJSFSchema>(
  $ref?: string,
  rootSchema: S = {} as S,
  recurseList: string[] = [],
  baseURI: string | undefined = rootSchema[ID_KEY],
): S {
  return findSchemaDefinitionWithBase($ref, rootSchema, recurseList, baseURI)[0];
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
