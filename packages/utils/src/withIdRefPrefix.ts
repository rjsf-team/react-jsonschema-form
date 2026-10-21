import { ID_KEY, REF_KEY, ROOT_SCHEMA_PREFIX } from './constants.ts';
import isObject from './isObject.ts';
import parseSchemaGraph from './schema/graph/parseSchemaGraph.ts';
import type { AdoptedSchema, SchemaGraph } from './schema/graph/parseSchemaGraph.ts';
import { readProvenance } from './schema/graph/provenance.ts';
import { declaringSeed } from './schema/retrieveSchema.ts';
import { isSubschemaKeyword, keywordShape, resolveUri } from './schemaUri.ts';
import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** How `prefixRefs()` rewrites the `$ref`s of a schema handed to a validator beside the root */
interface RefRewrite {
  /** The id of the root schema the local `$ref`s name, without an empty trailing fragment */
  readonly base: string;
  /** Returns the `$ref` a subschema of the root is to hold in place of its own, given the base the validator resolves
   * a `$ref` there against, or undefined where it is to hold its own, prefixed as written
   */
  readonly nestedRef?: (holder: object, scope: string) => string | undefined;
}

/** Returns the `$ref` naming the subschema at the JSON `pointer` in the root, encoded as `encodeURI()` encodes it,
 * which leaves the characters a fragment may hold, such as the `$` of `$defs`, as they are. A `#` is escaped too:
 * `encodeURI()` keeps it, and Ajv drops one ending the `$ref` as an empty fragment. A lone surrogate, which a property
 * name may hold, has no UTF-8 encoding and is left as it is.
 */
function refTo(pointer: string): string {
  return `#${pointer.replace(/[^\uD800-\uDFFF]+/gu, (wellFormed) => encodeURI(wellFormed)).replaceAll('#', '%23')}`;
}

/** Returns the node of the subschema `holder` stands for in the root `graph` was parsed from, and the graph holding
 * it. A subschema `retrieveSchema()` handed out is a copy no graph holds, merged from declarations that can sit in
 * several resources, so its `$ref` is read from the declaration that wrote it, which its stamp names.
 */
function holderNode<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, holder: object): AdoptedSchema<S> | undefined {
  const stamped = readProvenance<S>(holder, graph);
  const ref: unknown = Reflect.get(holder, REF_KEY);
  if (stamped !== undefined && typeof ref === 'string') {
    const declaring = declaringSeed(stamped.graph, stamped.seeds, ref);
    if (declaring !== undefined) {
      return { graph: stamped.graph, node: declaring.node };
    }
  }
  const id = graph.byObject(holder);
  return id === undefined ? undefined : { graph, node: id };
}

/** Returns the `nestedRef` of a `RefRewrite` for the root `graph` was parsed from, registered under `rootId`. A
 * subschema of the root that sits in a resource of its own, below an `$id` of its own or one around it, holds a `$ref`
 * that resolves against that resource, but the subschema a validator is handed, such as an option or an `if`, no
 * longer sits under that `$id`. So the target the graph resolved the `$ref` to is named by its pointer in the root.
 * Where an `$id` the schema handed over still holds around the `$ref` would resolve that pointer elsewhere, as an
 * absolute one does a root registered under a relative id such as `ROOT_SCHEMA_PREFIX`, no pointer is returned, and
 * neither is one for any other `$ref`: one written in the root's own resource, or one that resolves to nothing. Of
 * those, only a relative `$ref` is left for the validator to resolve against that `$id`: `rootRef()` puts the root's
 * id in front of a fragment one, which then resolves against the `$id` and misses.
 */
function nestedRefOf<S extends StrictRJSFSchema>(
  graph: SchemaGraph<S>,
  rootId: string,
): NonNullable<RefRewrite['nestedRef']> {
  const root = graph.node(graph.root);
  /* v8 ignore next -- the root of a graph is the object node the root schema parsed to */
  const rootBase = root.kind === 'schema' ? root.baseUri : undefined;
  return (holder, scope) => {
    const held = holderNode(graph, holder);
    const node = held === undefined ? undefined : held.graph.node(held.node);
    if (held === undefined || node?.kind !== 'schema' || node.baseUri === rootBase || node.ref === undefined) {
      return undefined;
    }
    const target = held.graph.node(node.ref);
    // Only a pointer the root's own graph knows names the target in the root the validator registers: a target that
    // a schema adopted from outside the root holds is known to the graph extending the root with it alone
    if (target.kind === 'invalid' || graph.byPointer(target.pointer) === undefined) {
      return undefined;
    }
    const ref = `${rootId}${refTo(target.pointer)}`;
    return resolveUri(scope, ref) === resolveUri('', ref) ? ref : undefined;
  };
}

/** Returns the `$ref` written as `ref` as a schema validated beside the root has to spell it: one local to the root
 * names the root by `base`, and a relative one names a resource beside the root, so it is resolved against the root's
 * URI, which a root without an `$id` does not have. Under an `$id` the handed schema holds, a relative one resolves
 * against that `$id` instead, read against the root's URI as one written in the root would be.
 *
 * @param ref - The `$ref` as written
 * @param base - The id of the root schema, without an empty trailing fragment
 * @param scope - The `$id` the handed schema holds around the `$ref`, resolved as the validator resolves it, or `''`
 *        where it holds none
 * @returns - The `$ref` as the validator is to resolve it
 */
function rootRef(ref: string, base: string, scope: string): string {
  if (ref.startsWith('#')) {
    return base + ref;
  }
  if (base === ROOT_SCHEMA_PREFIX) {
    return ref;
  }
  return resolveUri(scope === '' ? base : resolveUri(base, scope), ref);
}

/** Returns the value of a subschema keyword with each subschema it holds prefixed, as `keywordShape()` reads its shape:
 * the subschema itself, each one of a list, or each value of a map, whose keys, such as property names, are no keywords
 */
function prefixSubschemas(key: string, value: unknown, rewrite: RefRewrite, scope: string): unknown {
  if (keywordShape(key, value) === 'map' && isObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([name, subschema]) => [name, prefixRefs(subschema, rewrite, scope)]),
    );
  }
  return prefixRefs(value, rewrite, scope);
}

/** Takes a `node` object and transforms any contained `$ref` node variables with a prefix, recursively calling
 * `prefixRefs` for any other elements. Only a keyword holding subschemas is read as schemas: any other, such as `const`,
 * `enum`, `default` or `examples`, holds data, where a `$ref` key is part of a value, so only a local one is prefixed
 * there, as `withIdRefPrefix()` prefixes every local one
 *
 * @param node - The copy of `holder` to which the `base` is added when a REF_KEY is part of it
 * @param holder - The object node `node` copies, by which the graph knows it
 * @param rewrite - How the `$ref`s are rewritten
 * @param outerScope - The base the validator resolves a `$ref` around the object against
 * @param isData - Whether the object is part of a data keyword's value rather than a schema
 */
function withIdRefPrefixObject(
  node: GenericObjectType,
  holder: object,
  rewrite: RefRewrite,
  outerScope: string,
  isData: boolean,
): GenericObjectType {
  const realObj: GenericObjectType = node;
  const ownId: unknown = realObj[ID_KEY];
  const scope =
    !isData && typeof ownId === 'string' && !ownId.startsWith('#') ? resolveUri(outerScope, ownId) : outerScope;
  const nestedRef = isData ? undefined : rewrite.nestedRef?.(holder, scope);
  for (const key in realObj) {
    /* v8 ignore next -- spread in caller guarantees only own properties reach this loop */
    if (Object.hasOwn(realObj, key)) {
      const value = realObj[key];
      if (key === REF_KEY && typeof value === 'string') {
        if (!isData) {
          realObj[key] = nestedRef ?? rootRef(value, rewrite.base, scope);
        } else if (value.startsWith('#')) {
          realObj[key] = rewrite.base + value;
        }
      } else if (isData || !isSubschemaKeyword(key)) {
        realObj[key] = prefixRefs(value, rewrite, scope, true);
      } else {
        realObj[key] = prefixSubschemas(key, value, rewrite, scope);
      }
    }
  }
  return node;
}

/** Takes a `node` object list and transforms any contained `$ref` node variables with a prefix, recursively calling
 * `prefixRefs` for any other elements.
 *
 * @param node - The list of object nodes to which the `base` is added when a REF_KEY is part of it
 * @param rewrite - How the `$ref`s are rewritten
 * @param scope - The base the validator resolves a `$ref` in the list against
 */
function withIdRefPrefixArray(node: unknown[], rewrite: RefRewrite, scope: string, isData: boolean): unknown[] {
  return node.map((item) => prefixRefs(item, rewrite, scope, isData));
}

function prefixRefs<S extends StrictRJSFSchema = RJSFSchema>(
  schemaNode: S,
  rewrite: RefRewrite,
  scope?: string,
  isData?: boolean,
): S;
function prefixRefs<S extends StrictRJSFSchema = RJSFSchema>(
  schemaNode: S | S[] | S[keyof S],
  rewrite: RefRewrite,
  scope?: string,
  isData?: boolean,
): S | S[] | S[keyof S];
function prefixRefs(schemaNode: unknown, rewrite: RefRewrite, scope?: string, isData?: boolean): unknown;
function prefixRefs(schemaNode: unknown, rewrite: RefRewrite, scope = '', isData = false): unknown {
  if (Array.isArray(schemaNode)) {
    return withIdRefPrefixArray([...schemaNode], rewrite, scope, isData);
  }
  if (isObject(schemaNode)) {
    return withIdRefPrefixObject({ ...schemaNode }, schemaNode, rewrite, scope, isData);
  }
  return schemaNode;
}

/** Returns the id a validator registers `rootSchema` under, and so the prefix `withRootIdRefPrefix()` gives the local
 * `$ref`s it rewrites: the root's own `$id`, or `ROOT_SCHEMA_PREFIX` where it has none, since an empty `$id` names
 * nothing a `$ref` could resolve against
 *
 * @param rootSchema - The root schema
 * @returns - The id the root is registered under
 */
export function rootSchemaIdOf<S extends StrictRJSFSchema = RJSFSchema>(rootSchema: S): string {
  return rootSchema[ID_KEY] || ROOT_SCHEMA_PREFIX;
}

/** Recursively prefixes every `$ref` local to the root document, one starting with `#`, with the id `rootSchema` is
 * registered under, as `rootSchemaIdOf()` returns it, and resolves every relative one against that id where the root
 * has an `$id`. An id ending in an empty fragment, as `http://example.com/root.json#` does, names the same document as
 * one without it, so that `#` is left out of the prefix rather than doubled. This is what a validator applies to a
 * schema it validates beside `rootSchema`, so that a `$ref` written in the root resolves against the root whatever the
 * schema holding it is registered as.
 *
 * A `$ref` a subschema of the root holds where it sits in a resource of its own, below its own `$id` or one around
 * it, resolves against that resource rather than the root, so it is spelled as the pointer to its target in the root,
 * with the id as the prefix: the subschema handed over, such as an option or an `if`, no longer sits under that `$id`.
 *
 * @param schemaNode - The object node to which the prefix is added when a REF_KEY is part of it
 * @param rootSchema - The root schema the local `$ref`s name
 * @param [rootId=rootSchemaIdOf(rootSchema)] - The id the validator registers `rootSchema` under, where it is not the
 *        one `rootSchemaIdOf()` gives
 * @returns - A copy of the `schemaNode` with updated `$ref`s
 */
export function withRootIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(
  schemaNode: S,
  rootSchema: S,
  rootId = rootSchemaIdOf(rootSchema),
): S {
  const base = rootId.replace(/#$/, '');
  // A root that is no schema object, which an untyped caller may hand a validator, has no subschemas to find
  return prefixRefs<S>(schemaNode, {
    base,
    nestedRef: isObject(rootSchema) ? nestedRefOf(parseSchemaGraph<S>(rootSchema), base) : undefined,
  });
}

/** Recursively prefixes all `$ref`s local to the root document, one starting with `#`, with the value of the
 * `ROOT_SCHEMA_PREFIX` constant. This is used in isValid to make references to the rootSchema
 *
 * @param schemaNode - The object node to which a ROOT_SCHEMA_PREFIX is added when a REF_KEY is part of it
 * @returns - A copy of the `schemaNode` with updated `$ref`s
 */
export default function withIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(schemaNode: S[]): S[];
export default function withIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(schemaNode: S): S;
export default function withIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(schemaNode: S[keyof S]): S[keyof S];
export default function withIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(
  schemaNode: S | S[] | S[keyof S],
): S | S[] | S[keyof S];
export default function withIdRefPrefix<S extends StrictRJSFSchema = RJSFSchema>(
  schemaNode: S | S[] | S[keyof S],
): S | S[] | S[keyof S] {
  return prefixRefs<S>(schemaNode, { base: ROOT_SCHEMA_PREFIX });
}
