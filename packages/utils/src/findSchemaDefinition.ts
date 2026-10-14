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

/** Expresses `resolved`, a ref spelling already resolved against the root's base, relative to that base, so any
 * reader holding only the root resolves it back in one step: `resolveUri(base, spelling)` names the resource
 * again. Same-document pointers come back as the `#/...` spelling an author writes at the root; absolute URIs
 * stay absolute; a target outside the root's directory is reached with `..` segments.
 */
function relativizeToBase(base: string, resolved: string): string {
  const baseDoc = base.split('#')[0];
  if (ABSOLUTE_URI_REGEX.test(baseDoc) || baseDoc.startsWith('//')) {
    // An absolute base names its resources outright, so the resolved spelling needs no relativizing
    return resolved;
  }
  if (baseDoc !== '' && resolved.startsWith(`${baseDoc}#`)) {
    // A same-document pointer comes back as the `#/...` spelling an author writes at the root
    return resolved.slice(baseDoc.length);
  }
  if (ABSOLUTE_URI_REGEX.test(resolved) || resolved.startsWith('//') || resolved.startsWith('/')) {
    return resolved;
  }
  const dir = baseDoc.slice(0, baseDoc.lastIndexOf('/') + 1);
  if (dir === '' || resolved.startsWith(dir)) {
    return resolved.slice(dir.length);
  }
  // The target lives outside the root's directory: climb out of it
  const climbs = dir
    .slice(0, -1)
    .split('/')
    .map(() => '..')
    .join('/');
  return `${climbs}/${resolved}`;
}

/** Normalizes a URI for comparison: scheme and host case, default port, dot segments and percent-encoded unreserved
 * characters
 */
function normalizeUri(uri: string): string {
  return resolveUri('', uri).replace(ENCODED_UNRESERVED, decodeURIComponent);
}

export function uriEqual(a: string, b: string): boolean {
  return a === b || normalizeUri(a) === normalizeUri(b);
}

/** The name of the resource `uri` points at: a trailing empty fragment (`#` or `#/`) and then a trailing `/` are
 * part of neither name, so two spellings of one resource compare equal (draft-4/6/7 roots are commonly written
 * with a trailing `#`). Every `$id`-to-ref comparison goes through this so the spellings stay in step.
 */
export function resourceName(uri: string): string {
  return uri.replace(/#\/?$/, '').replace(/\/$/, '');
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
function childScope<S extends StrictRJSFSchema = RJSFSchema>(node: S, parentURI: string, pre2019 = false): string {
  const id = node[ID_KEY];
  // A fragment-only `$id` (`#foo`, `#/properties/address`) anchors a location inside the current resource
  // without changing its base URI, so the subtree keeps the parent scope. On a root before 2019-09 a `$ref`
  // ignores every sibling keyword, `$id` included, so a `$ref`-holding node's `$id` establishes no scope
  return typeof id === 'string' && !id.startsWith('#') && !(pre2019 && REF_KEY in node)
    ? resolveUri(parentURI, id)
    : parentURI;
}

/** Matches the scheme part of an absolute URI (`https:`, `urn:`), which no relative ref can carry
 */
const ABSOLUTE_URI_REGEX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

/** True when `rootSchema` predates draft 2019-09 (a root without `$schema` counts as draft-7): a `$ref` on
 * such a root ignores its sibling keywords, so an `$id` written beside a `$ref` must not re-base anything
 */
export function isPre2019Root<S extends StrictRJSFSchema = RJSFSchema>(rootSchema: S): boolean {
  return rootSchema[SCHEMA_KEY] !== JSON_SCHEMA_DRAFT_2019_09 && rootSchema[SCHEMA_KEY] !== JSON_SCHEMA_DRAFT_2020_12;
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
  normalizedRef: string,
  baseURI = '',
  asWrittenRef?: string,
  pre2019 = false,
): FoundSchema<S> | undefined {
  const currentURI = childScope(schema, baseURI, pre2019);
  // `ref` is normalized once by the caller (`findEmbeddedSchemaRecursive`) rather than at every `$id` node here
  const currentName = resourceName(currentURI);
  if (
    typeof schema[ID_KEY] === 'string' &&
    // A fragment-only `$id` is an anchor: it leaves the scope unchanged, so it must not match the scope it
    // sits in, the same way `childScope` leaves it out of the scope
    !schema[ID_KEY].startsWith('#') &&
    (currentName === ref ||
      normalizeUri(currentName) === normalizedRef ||
      (asWrittenRef !== undefined && schema[ID_KEY] === asWrittenRef))
  ) {
    return { schema, baseURI: currentURI };
  }
  for (const subSchema of subschemas(schema)) {
    const result = walkEmbeddedSchemas<S>(subSchema, ref, normalizedRef, currentURI, asWrittenRef, pre2019);
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
  pre2019 = false,
): FoundSchema<S> | undefined {
  // The ref's normalized form is computed once for the whole walk rather than per `$id` node
  const normalizedRef = normalizeUri(ref);
  return (
    walkEmbeddedSchemas<S>(schema, ref, normalizedRef, baseURI, undefined, pre2019) ??
    (asWrittenRef !== undefined
      ? walkEmbeddedSchemas<S>(schema, ref, normalizedRef, baseURI, asWrittenRef, pre2019)
      : undefined)
  );
}

/** Recovers the lexical scope a node sits in within `rootSchema`, computed the way the resolution walk computes
 * it while descending from the root: each scope-establishing `$id` on the path re-bases the scope. A caller that
 * hands `retrieveSchema` a node an earlier walk returned holds no base URI for it, yet the node's relative refs
 * still mean the resource the node sits in. The match is by identity: a node the walk cannot find (a merged or
 * rebuilt result) has no recoverable scope.
 *
 * @param rootSchema - The root schema to search
 * @param target - The node whose lexical scope is wanted
 * @returns - The scope `target`'s refs resolve against, or `undefined` when `target` is not in `rootSchema`
 */
export function lexicalScopeOfNode<S extends StrictRJSFSchema = RJSFSchema>(
  rootSchema: S,
  target: S,
): string | undefined {
  const pre2019 = isPre2019Root(rootSchema);
  const seen = new Set<unknown>();
  const walk = (node: S, parentScope: string): string | undefined => {
    // A subtree shared between positions is walked once: its scope is the one its first position establishes
    if (seen.has(node)) {
      return undefined;
    }
    seen.add(node);
    const scope = childScope(node, parentScope, pre2019);
    if (node === target) {
      return scope;
    }
    for (const subSchema of subschemas(node)) {
      const found = walk(subSchema, scope);
      if (found !== undefined) {
        return found;
      }
    }
    return undefined;
  };
  return walk(rootSchema, '');
}

/** Resolves an RFC 6901 JSON pointer against `node` while tracking the lexical scope: every `$id` on the path
 * re-bases the result, so a pointer that lands on a sub-resource reports that resource's scope, not the outer
 * one. `baseURI` is the scope `node` itself establishes (its own `$id` already applied).
 */
function getByPointerWithScope<S extends StrictRJSFSchema = RJSFSchema>(
  node: S,
  pointer: string,
  baseURI: string | undefined,
  pre2019 = false,
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
    if (
      currentIsSchema &&
      isObject(current) &&
      typeof current[ID_KEY] === 'string' &&
      !current[ID_KEY].startsWith('#') &&
      !(pre2019 && REF_KEY in current)
    ) {
      currentScope = resolveUri(currentScope ?? '', current[ID_KEY]);
    }
  }
  return { schema: current as S, baseURI: currentScope };
}

/** Applies `fn` to the direct subschemas of `schema` (following the keyword shapes above), rebuilding only
 * the containers whose contents changed. `extraChanges` carries updates to the schema's own data keys,
 * included in the same rebuild. `onlyKeys` limits the walk to the keywords its predicate accepts for a
 * given value, so a caller can match the shape another walk follows. When neither a
 * subschema nor an extra change differs,
 * `schema` itself is returned, so identity means nothing changed. The rebuild spreads the original node and
 * overwrites only the changed keys, so symbol keys (such as the rjsf flag Symbols) survive it.
 */
function mapSubschemas<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  fn: (subSchema: S) => S,
  extraChanges?: GenericObjectType,
  onlyKeys?: (key: string, value: unknown) => boolean,
): S {
  const changed: GenericObjectType = {};
  let anyChanged = false;
  const apply = (key: string, next: unknown) => {
    if (next !== (schema as unknown as GenericObjectType)[key]) {
      changed[key] = next;
      anyChanged = true;
    }
  };
  const entries = Object.entries(schema).filter(([key, value]) => onlyKeys === undefined || onlyKeys(key, value));
  for (const [key, value] of entries) {
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

/** The ref each normalized node carried before `makeAllReferencesAbsolute` rewrote it, kept so that a caller which needs the author's
 * spelling (`resolveUiSchema`, or a local `$id` overriding the referenced resource's scope) can recover it.
 */
const originalRefs = new WeakMap<StrictRJSFSchema, string>();

/** Returns the ref `schema` carried before normalization rewrote it, or undefined when it holds its original
 * spelling (or was never normalized).
 */
export function originalRefOf<S extends StrictRJSFSchema>(schema: S): string | undefined {
  return originalRefs.get(schema);
}

/** Copies the pre-normalization ref association from `source` onto `copy`: a rebuild that spreads a normalized
 * node (the cycle-flag copy in `retrieveSchema`) would otherwise lose the author's spelling, which `originalRefOf`
 * readers (`resolveUiSchema`) key on.
 */
export function carryOriginalRef<S extends StrictRJSFSchema = RJSFSchema>(copy: S, source: S): S {
  const original = originalRefs.get(source);
  if (original !== undefined) {
    originalRefs.set(copy, original);
  }
  return copy;
}

/** Parses a JSONSchema and makes all references absolute with respect to
 * the `baseURI` argument. The walk follows the schema-valued keywords (see the keyword sets above): only a
 * string `$ref` is a reference to resolve, and only a string `$id` re-bases its subtree.
 *
 * @param schema - The schema to be processed
 * @param baseURI - The base URI to be used for resolving relative references
 */
export function makeAllReferencesAbsolute<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  baseURI: string,
  pre2019 = false,
): S {
  const rootId = typeof schema[ID_KEY] === 'string' ? schema[ID_KEY] : undefined;
  // One existence answer per distinct resource name, so the walk asks once no matter how many refs share a target
  const knownTargets = new Map<string, boolean>();
  const targetExists = (candidate: string): boolean => {
    const [refId] = candidate.replace(/#\/?$/, '').split('#');
    if (refId === '') {
      return true;
    }
    const known = knownTargets.get(refId);
    if (known !== undefined) {
      return known;
    }
    const name = resourceName(refId);
    const exists =
      (rootId !== undefined && uriEqual(name, resourceName(rootId))) ||
      findEmbeddedSchemaRecursive(schema, name, '', undefined, pre2019) !== undefined;
    knownTargets.set(refId, exists);
    return exists;
  };
  const visit = (node: S, currentURI: string): S => {
    const ref = node[REF_KEY];
    // A node this function already rewrote holds its resolved ref, with the author's spelling in
    // `originalRefs`: resolving it again would re-base it against the nested `$id` a second time. The
    // `alreadyNamesTarget` check is what makes the walk idempotent beyond object identity: a deep copy of
    // a normalized root carries refs that already name their resource root-relatively, and resolving such
    // a ref against the nested `$id` a second time names a resource that does not exist, so the spelling
    // is kept instead of corrupting toward a doubled path. When the scope-resolved target does exist the
    // rewrite still happens: the scoped reading is the one the author meant, and relative external refs
    // (whose target never lives in this root) are still absolutized.
    const resolved = typeof ref === 'string' ? resolveUri(currentURI, ref) : undefined;
    const alreadyNamesTarget =
      typeof ref === 'string' &&
      resolved !== undefined &&
      resolved !== ref &&
      !targetExists(resolved) &&
      targetExists(ref);
    // Every rewritten ref is spelled relative to the root's base, the way `v6` spelled them: a reader that
    // holds only the root - a validator compiling the root, or a lookup that knows no lexical scope - resolves
    // the spelling in one step, and no nested `$id` re-bases it because validators pre-resolve relative refs
    // against the root they registered before compiling. A same-document pointer to the root comes back as the
    // `#/...` spelling an author writes, so compiling the root never re-resolves the root's own `$id` against
    // itself (a relative root `$id` with a directory part would double-resolve). The author's spelling is
    // recorded on the node for readers that key on it (`ui:definitions`, cycle markers).
    const refChange =
      typeof ref === 'string' &&
      resolved !== undefined &&
      !originalRefs.has(node) &&
      resolved !== ref &&
      !alreadyNamesTarget
        ? { [REF_KEY]: relativizeToBase(startURI, resolved) }
        : undefined;
    const visited = mapSubschemas(
      node,
      (subSchema) => visit(subSchema, childScope(subSchema, currentURI, pre2019)),
      refChange,
    );
    if (typeof ref === 'string' && visited[REF_KEY] !== ref) {
      originalRefs.set(visited, ref);
    }
    return visited;
  };
  const startURI = typeof schema[ID_KEY] === 'string' ? schema[ID_KEY] : baseURI;
  return visit(schema, startURI);
}

/** The keywords `restoreOriginalRefs` rebuilds, matching the keywords whose refs the resolution walk resolves
 * (an `items` only in its single-schema shape: tuple items are data to that walk, and to this one)
 */
const RESTORE_KEYS: ReadonlySet<string> = new Set([PROPERTIES_KEY, ITEMS_KEY]);
const RESTORE_KEYS_WITH_OPTIONS: ReadonlySet<string> = new Set([PROPERTIES_KEY, ITEMS_KEY, ANY_OF_KEY, ONE_OF_KEY]);

/** Returns `schema` with the refs `makeAllReferencesAbsolute()` rewrote set back to the spelling the document
 * author wrote, so a caller that must read the content as written - a local `$id` overriding the referenced
 * resource's scope - can do so even when all it holds is the normalized root. Only the refs the resolution walk
 * itself resolves are restored: a ref under a keyword the walk does not visit (`allOf`, `if`/`then`,
 * `dependencies`, or an unexpanded `anyOf`/`oneOf`) would come back relative to the root, where later passes
 * could no longer find its resource, so it keeps the resolved spelling.
 *
 * @param schema - The schema whose restored subtree is needed
 * @param [restoreOptions=false] - When true, refs under `anyOf`/`oneOf` are restored too (the caller walks them)
 * @param [fallbackScope] - The scope the restored schema's content was written in (the resource root's own
 *        `$id`, as the lookup reported it). Passed by a caller that re-identifies the resource (a local `$id`
 *        beside a `$ref`): refs the normalization left as written under keywords the resolution walk does not
 *        visit would otherwise resolve against the overriding scope on a later pass, so they are resolved
 *        against this scope instead. Restored refs are untouched: the override re-reads those as written.
 */
export function restoreOriginalRefs<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  restoreOptions = false,
  fallbackScope?: string,
): S {
  const original = originalRefs.get(schema);
  const keys = restoreOptions ? RESTORE_KEYS_WITH_OPTIONS : RESTORE_KEYS;
  // The resolution walk skips array-valued `items` (`!Array.isArray(resolvedSchema.items)` in
  // `retrieveSchema`), so a tuple item's ref is never resolved by it: restoring the author's spelling there
  // would send a later `retrieveSchema` looking for the resource relative to the root. Array-valued `items`
  // keeps the resolved spelling the normalization walk left.
  const restoreKey = (key: string, value: unknown) => keys.has(key) && !(key === ITEMS_KEY && Array.isArray(value));
  const restored = mapSubschemas<S>(
    schema,
    (subSchema) => restoreOriginalRefs(subSchema, restoreOptions, fallbackScope),
    original !== undefined ? { [REF_KEY]: original } : undefined,
    restoreKey,
  );
  if (fallbackScope === undefined) {
    return restored;
  }
  // A second pass over the keywords the restore skipped (its whole subtrees are unvisited by the resolution
  // walk): a ref the normalization left as written there would resolve against the caller's overriding scope
  // on a later pass, so it is resolved against the scope it was written in. Refs the normalization rewrote
  // (marked in `originalRefs`) keep their resolved spelling, and restored refs outside these subtrees were
  // the override's to re-read as written.
  const resolveUnvisited = (node: S, scope: string): S => {
    const nodeRef = node[REF_KEY];
    const resolveChange =
      originalRefs.get(node) === undefined &&
      typeof nodeRef === 'string' &&
      !nodeRef.startsWith('#') &&
      !ABSOLUTE_URI_REGEX.test(nodeRef) &&
      !nodeRef.startsWith('//')
        ? { [REF_KEY]: resolveUri(scope, nodeRef) }
        : undefined;
    return mapSubschemas<S>(
      node,
      (subSchema) => resolveUnvisited(subSchema, childScope(subSchema, scope)),
      resolveChange,
    );
  };
  return mapSubschemas<S>(
    restored,
    (subSchema) => resolveUnvisited(subSchema, childScope(subSchema, fallbackScope)),
    undefined,
    (key, value) => !restoreKey(key, value),
  );
}

/** Roots already produced by `normalizeRootReferences`. Normalization resolves every ref against the scope its
 * subtree sits in, so running it twice would resolve the already-resolved refs a second time and corrupt them;
 * between this marker set and the per-node `originalRefs` check in `makeAllReferencesAbsolute`, the function is
 * idempotent for its own output and for shallow copies of it. There is deliberately no memo per raw root: a root
 * edited in place after its first normalization must be read as it now stands.
 */
const normalizedRoots = new WeakSet<StrictRJSFSchema>();

/** The root a caller handed in, keyed by the root `normalizeRootReferences` produced from it. Validators compile
 * the author's document: the normalized root carries rewritten ref spellings a validator resolves a second time
 * against the enclosing `$id` (a relative root `$id` with a directory part then double-resolves), so a validator
 * must never see the normalized root
 */
const rawRoots = new WeakMap<StrictRJSFSchema, StrictRJSFSchema>();

/** The marked no-op copies `normalizeRootReferences()` returned for roots that held nothing to rewrite. A caller
 * holding one can hand its own original back when a resolution walk changes nothing, keeping the identity contract
 * `resolveAllReferences()` had before normalization existed
 */
const noopNormalizedRoots = new WeakSet<StrictRJSFSchema>();

/** Returns the root exactly as the caller wrote it when `rootSchema` is a root `normalizeRootReferences` produced,
 * `undefined` otherwise
 */
export function rawRootOf<S extends StrictRJSFSchema = RJSFSchema>(rootSchema: S): S | undefined {
  return rawRoots.get(rootSchema) as S | undefined;
}

/** Returns `[schema, rootSchema]` as a validator must see them: the root exactly as the author wrote it, or the
 * pair as given when no normalization produced the root. The schema needs no rewriting: normalization spells
 * every ref relative to the root's base, so a validator resolves the spelling in one step no matter which
 * scope the ref was written in
 */
export function forValidation<S extends StrictRJSFSchema = RJSFSchema>(schema: S, rootSchema: S): [S, S] {
  const rawRoot = rawRootOf<S>(rootSchema);
  return rawRoot !== undefined ? [schema, rawRoot] : [schema, rootSchema];
}

/** Returns `rootSchema` with every ref inside it resolved against the root's own base (`$id` when present, `#`
 * otherwise), so that refs carried by nested content keep the meaning they were written with no matter which
 * scope later looks them up. A root this function already produced comes back unchanged, so repeated entry points
 * (`createSchemaUtils` at construction, `resolveAllReferences` on every walk) never stack a second normalization
 * onto the first.
 *
 * @param rootSchema - The root schema to normalize
 * @returns - The normalized root. When normalization changed nothing, a marked shallow copy of it, not the
 *      original object: the mark is what lets a caller that stores the result (`createSchemaUtils`) skip a fresh
 *      walk on later calls, while the caller's unmarked original is still re-read as it stands when passed in
 *      again. A side effect of the copy is that `retrieveSchema(validator, root, root)` on such a root returns a
 *      new object rather than `root` itself
 */
export function normalizeRootReferences<S extends StrictRJSFSchema = RJSFSchema>(rootSchema: S): S {
  if (normalizedRoots.has(rootSchema)) {
    return rootSchema;
  }
  const normalized = makeAllReferencesAbsolute<S>(
    rootSchema,
    typeof rootSchema[ID_KEY] === 'string' ? rootSchema[ID_KEY] : '#',
    isPre2019Root(rootSchema),
  );
  if (normalized !== rootSchema) {
    // Only a root this function produced is marked: marking the input when something changed would freeze it,
    // and a root edited in place after a normalization must be read as it now stands on the next call
    normalizedRoots.add(normalized);
    rawRoots.set(normalized, rootSchema);
    return normalized;
  }
  // A no-op normalization gets a marked shallow copy: a caller that stores the result (createSchemaUtils)
  // then holds a root the per-call wrapper recognizes without a fresh walk, while the caller's original
  // stays unmarked, so a root edited in place is still re-read as it stands when it is passed in again
  const copy = { ...rootSchema };
  normalizedRoots.add(copy);
  rawRoots.set(copy, rootSchema);
  noopNormalizedRoots.add(copy);
  return copy;
}

/** Returns whether `rootSchema` is a copy `normalizeRootReferences()` made of a root it had nothing to rewrite in,
 * so the root it was given and the root it returned differ only by the mark
 *
 * @param rootSchema - The root schema to check
 * @returns - True when normalizing the root rewrote no reference in it
 */
export function normalizationRewroteNothing<S extends StrictRJSFSchema = RJSFSchema>(rootSchema: S): boolean {
  return noopNormalizedRoots.has(rootSchema);
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
  refIsResolved = false,
  chainRefsResolved = false,
): FoundSchema<S> {
  const found = findSchemaDefinitionWithBaseURIOrUndefined<S>(
    $ref,
    rootSchema,
    recurseList,
    baseURI,
    refIsResolved,
    chainRefsResolved,
  );
  if (found === undefined) {
    throw new Error(`Could not find a definition for ${$ref}.`);
  }
  return found;
}

/** The undefined-returning form of `findSchemaDefinitionWithBaseURI`, for callers that want to retry a miss against
 * another scope rather than be thrown out. Only a ref that names nothing in the given scope comes back undefined: a
 * ref that hits a schema which itself carries a `$ref` chain still goes through `resolveFoundChain`, so a chain that
 * leads nowhere throws exactly as `findSchemaDefinitionWithBaseURI` would.
 *
 * @param $ref - The ref to resolve
 * @param rootSchema - The schema to search
 * @param recurseList - List of refs already expanded on the current resolution path
 * @param baseURI - The URI scope the ref resolves against
 * @param [refIsResolved=false] - When true, the `$ref` already names its resource absolutely (it was resolved by
 *      `normalizeRootReferences`), so its spelling is tried before resolving it against `baseURI`
 * @param [chainRefsResolved=false] - Same as `refIsResolved`, for the `$ref`s encountered while following a
 *      chained result
 * @returns - The found schema and its scope, or undefined when the ref names nothing in that scope
 */
export function findSchemaDefinitionWithBaseURIOrUndefined<S extends StrictRJSFSchema = RJSFSchema>(
  $ref?: string,
  rootSchema: S = {} as S,
  recurseList: string[] = [],
  baseURI: string | undefined = rootSchema[ID_KEY],
  refIsResolved = false,
  chainRefsResolved = false,
): FoundSchema<S> | undefined {
  const ref = $ref || '';
  const found = lookupSchemaDefinition<S>(ref, rootSchema, baseURI, refIsResolved);
  return found === undefined ? undefined : resolveFoundChain<S>(found, ref, rootSchema, recurseList, chainRefsResolved);
}

/** The lookup half of `findSchemaDefinitionWithBaseURI()`: where `ref` points, and the scope the found
 * node establishes. Returns `undefined` when the ref names nothing, so a caller can try another base
 * without driving the search through exceptions
 */
function lookupSchemaDefinition<S extends StrictRJSFSchema = RJSFSchema>(
  ref: string,
  rootSchema: S,
  baseURI: string | undefined,
  refIsResolved = false,
): FoundSchema<S> | undefined {
  const pre2019 = isPre2019Root(rootSchema);
  if (ref.startsWith('#')) {
    // Decode URI fragment representation.
    const decodedRef = decodeURIComponent(ref.substring(1));
    if (baseURI === undefined || (ID_KEY in rootSchema && rootSchema[ID_KEY] === baseURI)) {
      // The branch condition already guarantees the root's `$id` IS the base, so it is used as
      // written: resolving it against itself would double the directory part of a relative `$id`.
      const rootScope = ID_KEY in rootSchema && typeof rootSchema[ID_KEY] === 'string' ? rootSchema[ID_KEY] : baseURI;
      return getByPointerWithScope<S>(rootSchema, decodedRef, rootScope, pre2019);
    }
    // The non-`#` branch below finds embedded resources on every draft: a `#` ref chained from one resolves
    // inside it the same way, whatever the root's `$schema` says
    const resource = findEmbeddedSchemaRecursive<S>(rootSchema, baseURI.replace(/\/$/, ''), '', baseURI, pre2019);
    if (resource !== undefined) {
      return getByPointerWithScope<S>(resource.schema, decodedRef, resource.baseURI, pre2019);
    }
    return undefined;
  }
  // A ref that `normalizeRootReferences` resolved against its scope names its resource as given, so its
  // spelling is tried first. Any other ref (for example one a caller of the public API wrote) resolves
  // against the base URI first, so a resource whose `$id` merely repeats the spelling cannot shadow it.
  let candidates: string[];
  if (baseURI === undefined) {
    candidates = [ref];
  } else {
    const resolved = resolveUri(baseURI, ref);
    candidates = refIsResolved ? [...new Set([ref, resolved])] : [...new Set([resolved, ref])];
  }
  const rootId = typeof rootSchema[ID_KEY] === 'string' ? rootSchema[ID_KEY] : undefined;
  for (const candidate of candidates) {
    const [refId, ...refAnchor] = candidate.replace(/#\/?$/, '').split('#');
    const anchor = refAnchor.length > 0 ? decodeURIComponent(refAnchor.join('#')) : undefined;
    // A trailing slash or empty fragment is part of neither name: the ref and the root name the same resource
    // with or without them (draft-4/6/7 roots are commonly written with a trailing `#`)
    if (rootId !== undefined && uriEqual(resourceName(refId), resourceName(rootId))) {
      // The ref names the root resource itself: what follows the `#` is a pointer into it, whatever the
      // draft. The root's `$id` is used as written for the scope: resolving a relative `$id` against
      // itself would double its directory part.
      const found = getByPointerWithScope<S>(rootSchema, anchor ?? '', rootId, pre2019);
      if (found !== undefined) {
        return found;
      }
    } else {
      // `$id` marks an embedded resource from draft-6 on, and the normalization walk rewrites refs inside one
      // on every draft, so the lookup runs on every draft too; a root without `$id` resources simply finds none
      const resource = findEmbeddedSchemaRecursive<S>(rootSchema, refId.replace(/\/$/, ''), '', undefined, pre2019);
      if (resource !== undefined) {
        const found =
          anchor !== undefined
            ? getByPointerWithScope<S>(resource.schema, anchor, resource.baseURI, pre2019)
            : resource;
        if (found !== undefined) {
          return found;
        }
      }
    }
  }
  return undefined;
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
  chainRefsResolved = false,
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
    const subFound = lookupSchemaDefinition<S>(nextRef, rootSchema, found.baseURI, chainRefsResolved);
    if (subFound === undefined) {
      throw new Error(`Could not find a definition for ${nextRef}.`);
    }
    const sub = resolveFoundChain<S>(subFound, nextRef, rootSchema, [...recurseList, ref], chainRefsResolved);
    if (Object.keys(remaining).length > 0) {
      if (!isPre2019Root(rootSchema)) {
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
