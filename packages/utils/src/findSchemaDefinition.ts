import {
  ALL_OF_KEY,
  ID_KEY,
  JSON_SCHEMA_DRAFT_2019_09,
  JSON_SCHEMA_DRAFT_2020_12,
  REF_KEY,
  SCHEMA_KEY,
} from './constants.ts';
import isObject from './isObject.ts';
import { getByPath } from './pathUtils.ts';
import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Resolves an RFC 6901 JSON pointer against `obj`: the empty pointer is `obj` itself, every other pointer is a
 * `/`-led list of reference tokens with `~1` and `~0` unescaped in that order. Through `getByPath()` only own
 * properties resolve, so `/__proto__` finds nothing rather than `Object.prototype`, unless it is a genuine own data
 * key. A pointer without the leading `/` is not a JSON pointer, so it finds nothing too.
 */
function getByPointer<R>(obj: R, pointer: string): R | undefined {
  if (pointer === '') {
    return obj;
  }
  if (!pointer.startsWith('/')) {
    return undefined;
  }
  return getByPath<R>(
    obj,
    pointer
      .slice(1)
      .split('/')
      .map((token) => token.replaceAll('~1', '/').replaceAll('~0', '~')),
  );
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

/** Resolves `ref` against `base`, returning `ref` as written for a base the parser rejects (e.g. an opaque `urn:` base
 * with a relative-path ref), so lookups keep working instead of throwing. What the synthetic base contributed is read
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

/** Looks for the `$id` pointed by `ref` in the schema definitions embedded in
 * a JSON Schema bundle
 *
 * @param schema - The schema wherein `ref` should be searched
 * @param ref - The `$id` of the reference to search for
 * @returns - The schema matching the reference, or `undefined` if no match is found
 */
function findEmbeddedSchemaRecursive<S extends StrictRJSFSchema = RJSFSchema>(schema: S, ref: string): S | undefined {
  if (typeof schema[ID_KEY] === 'string' && uriEqual(schema[ID_KEY], ref)) {
    return schema;
  }
  for (const subSchema of Object.values(schema)) {
    if (Array.isArray(subSchema)) {
      for (const item of subSchema) {
        if (isObject(item)) {
          const result = findEmbeddedSchemaRecursive<S>(item as S, ref);
          if (result !== undefined) {
            return result;
          }
        }
      }
    } else if (isObject(subSchema)) {
      const result = findEmbeddedSchemaRecursive<S>(subSchema as S, ref);
      if (result !== undefined) {
        return result;
      }
    }
  }
  return undefined;
}

/** Parses a JSONSchema and makes all references absolute with respect to
 * the `baseURI` argument
 * @param schema - The schema to be processed
 * @param baseURI - The base URI to be used for resolving relative references
 */
export function makeAllReferencesAbsolute<S extends StrictRJSFSchema = RJSFSchema>(schema: S, baseURI: string): S {
  const currentURI = schema[ID_KEY] ?? baseURI;
  let result = schema;
  // Make all other references absolute
  if (REF_KEY in result) {
    result = { ...result, [REF_KEY]: resolveUri(currentURI, result[REF_KEY]!) };
  }
  // Look for references in nested subschemas
  for (const [key, subSchema] of Object.entries(result)) {
    if (Array.isArray(subSchema)) {
      result = {
        ...result,
        [key]: subSchema.map((item) => (isObject(item) ? makeAllReferencesAbsolute(item as S, currentURI) : item)),
      };
    } else if (isObject(subSchema)) {
      result = { ...result, [key]: makeAllReferencesAbsolute(subSchema as S, currentURI) };
    }
  }
  return result;
}

/** Splits out the value at the `key` in `object` from the `object`, returning an array that contains in the first
 * location, the `object` minus the `key: value` and in the second location the `value`.
 *
 * @param key - The key from the object to extract
 * @param object - The object from which to extract the element
 * @returns - An array with the first value being the object minus the `key` element and the second element being the
 *      value from `object[key]`
 */
export function splitKeyElementFromObject(key: string, object: GenericObjectType) {
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
export function findSchemaDefinitionRecursive<S extends StrictRJSFSchema = RJSFSchema>(
  $ref?: string,
  rootSchema: S = {} as S,
  recurseList: string[] = [],
  baseURI: string | undefined = rootSchema[ID_KEY],
): S {
  const ref = $ref || '';
  let current: S | undefined = undefined;
  let currentBaseURI = baseURI;
  if (ref.startsWith('#')) {
    // Decode URI fragment representation.
    const decodedRef = decodeURIComponent(ref.substring(1));
    if (currentBaseURI === undefined || (ID_KEY in rootSchema && rootSchema[ID_KEY] === currentBaseURI)) {
      current = getByPointer(rootSchema, decodedRef);
    } else if (rootSchema[SCHEMA_KEY] === JSON_SCHEMA_DRAFT_2020_12) {
      current = findEmbeddedSchemaRecursive<S>(rootSchema, currentBaseURI.replace(/\/$/, ''));
      if (current !== undefined) {
        current = getByPointer(current, decodedRef);
      }
    }
  } else if (rootSchema[SCHEMA_KEY] === JSON_SCHEMA_DRAFT_2020_12) {
    const resolvedRef = currentBaseURI ? resolveUri(currentBaseURI, ref) : ref;
    const [refId, ...refAnchor] = resolvedRef.replace(/#\/?$/, '').split('#');
    current = findEmbeddedSchemaRecursive<S>(rootSchema, refId.replace(/\/$/, ''));
    if (current !== undefined) {
      currentBaseURI = current[ID_KEY];
      if (refAnchor.length > 0) {
        current = getByPointer(current, decodeURIComponent(refAnchor.join('#')));
      }
    }
  }
  if (current === undefined) {
    throw new Error(`Could not find a definition for ${$ref}.`);
  }
  const nextRef = current[REF_KEY];
  if (nextRef) {
    // Check for circular references.
    if (recurseList.includes(nextRef)) {
      if (recurseList.length === 1) {
        throw new Error(`Definition for ${$ref} is a circular reference`);
      }
      const [firstRef, ...restRefs] = recurseList;
      const circularPath = [...restRefs, ref, firstRef].join(' -> ');
      throw new Error(`Definition for ${firstRef} contains a circular reference through ${circularPath}`);
    }
    const [remaining, theRef] = splitKeyElementFromObject(REF_KEY, current);
    const subSchema = findSchemaDefinitionRecursive<S>(theRef, rootSchema, [...recurseList, ref], currentBaseURI);
    if (Object.keys(remaining).length > 0) {
      if (
        rootSchema[SCHEMA_KEY] === JSON_SCHEMA_DRAFT_2019_09 ||
        rootSchema[SCHEMA_KEY] === JSON_SCHEMA_DRAFT_2020_12
      ) {
        return { [ALL_OF_KEY]: [remaining, subSchema] } as S;
      }
      return { ...remaining, ...subSchema };
    }
    return subSchema;
  }
  return current;
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
