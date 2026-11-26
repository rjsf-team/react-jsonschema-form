import {
  ADDITIONAL_ITEMS_KEY,
  ADDITIONAL_PROPERTIES_KEY,
  DEFINITIONS_KEY,
  DEPENDENCIES_KEY,
  DEPENDENT_SCHEMAS_KEY,
  ITEMS_KEY,
  PATTERN_PROPERTIES_KEY,
  PREFIX_ITEMS_KEY,
  PROPERTIES_KEY,
  REF_KEY,
} from './constants.ts';
import isObject from './isObject.ts';
import { getByPath } from './pathUtils.ts';
import parseSchemaGraph, { stringKeyword } from './schema/graph/parseSchemaGraph.ts';
import type { NodeId, ObjectNode, SchemaGraph } from './schema/graph/parseSchemaGraph.ts';
import { requireOwnRef, resolveMergedOwnRef } from './schema/retrieveSchema.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Keywords whose subschemas merging a `$ref` schema with its target combines into one, so the subschema a path reads
 * under one is the same whichever of the two it indexes. Merging reorders, replaces or moves into `allOf` every other
 * one, including a list keyword inside a subschema both of them hold */
const MERGE_COMBINED_KEYS = [PROPERTIES_KEY, PATTERN_PROPERTIES_KEY, ADDITIONAL_PROPERTIES_KEY, 'propertyNames'];

/** Keywords whose subschemas merging joins with the target's, a whole schema or position by position, so the merged
 * schema holds the titles of both. An index after `prefixItems` or a tuple `items` reads the same position either way */
const MERGE_JOINED_KEYS = [...MERGE_COMBINED_KEYS, ITEMS_KEY, PREFIX_ITEMS_KEY, ADDITIONAL_ITEMS_KEY];

/** Returns whether every keyword along `keys` is one merging joins, so the merged schema holds the subschema they lead
 * to, joined with the other's, rather than a list merging reorders. A `$ref` along them is followed from that merged
 * subschema */
function readsJoined(keys: string[]): boolean {
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    if (key !== REF_KEY && !MERGE_JOINED_KEYS.includes(key)) {
      return false;
    }
    // The key after one is a name, or a position in a tuple, never a keyword
    if (key === PROPERTIES_KEY || key === PATTERN_PROPERTIES_KEY || /^\d+$/.test(keys[index + 1])) {
      index += 1;
    }
  }
  return true;
}

/** Returns the own `$ref` of the walk's `schema` resolved, with the subschema it names, the schemas the graph holds
 * that the resolved schema is merged from and whether the merge failed, there or further along the chain of `$ref`s. A
 * copy merging made from `seeds`, which no graph node holds, has its `$ref` resolved from the seed writing it, in that
 * seed's resource, where read alone it would resolve against the root
 */
function ownRef<S extends StrictRJSFSchema>(graph: SchemaGraph<S>, seeds: object[], schema: S) {
  const held = graph.byObject(schema) !== undefined;
  // A copy's `$ref` is one of its seeds', unless the copy is an entry of a list merging crossed, whose position no
  // seed's matches: that one is resolved against the root, as read alone
  const writer = held
    ? undefined
    : (seeds.find((seed) => stringKeyword(seed, REF_KEY) === schema[REF_KEY]) as S | undefined);
  const { resolved, target } = requireOwnRef<S>(writer ?? schema, graph.rawRoot);
  const merged = writer === undefined ? [] : [...seeds];
  if (held) {
    merged.push(schema);
  }
  // A link whose merge fails leaves its `allOf` in every merge before it
  let chainFailed = false;
  for (let link = target; link !== undefined;) {
    merged.push(link);
    const next = stringKeyword(link, REF_KEY) === undefined ? undefined : requireOwnRef<S>(link as S, graph.rawRoot);
    chainFailed ||= next !== undefined && mergeFailed(link, next.resolved);
    link = next?.target;
  }
  if (writer === undefined) {
    return { resolved, target, seeds: merged, failed: chainFailed || mergeFailed(schema, resolved) };
  }
  // Parsed in the writer's resource, the copy's own keywords decide how its `$ref` joins them
  const copy = graph.adopt(schema, (graph.node(graph.byObject(writer) as NodeId) as ObjectNode<S>).outerBase);
  const copyResolved = resolveMergedOwnRef<S>(copy.graph, [{ node: copy.node, refPath: [] }], schema);
  return { resolved: copyResolved, target, seeds: merged, failed: chainFailed || mergeFailed(schema, copyResolved) };
}

/** Returns whether merging the `$ref` `schema` with its target failed, which, as for disjoint `type`s, leaves the
 * `allOf` of the two without the `$ref` schema's own keywords */
function mergeFailed(schema: object, resolved: object): boolean {
  return Object.keys(schema).some((key) => key !== REF_KEY && !Object.hasOwn(resolved, key));
}

/** Keywords whose value maps names to schemas, so the key after one is a name rather than a keyword */
const NAME_MAP_KEYS = [
  PROPERTIES_KEY,
  PATTERN_PROPERTIES_KEY,
  DEPENDENT_SCHEMAS_KEY,
  DEPENDENCIES_KEY,
  '$defs',
  DEFINITIONS_KEY,
];

/** Used by the validator packages to find the schema object holding the keyword a validation error reports, when the
 * engine doesn't hand over one that is resolved. The `schemaPath` is read from the `rootSchema` down, following each
 * `$ref` it passes through, whether written into the path as a `$ref` key, whose next key is read from the `$ref`'s
 * target alone unless the rest of the path runs through keys merging joins alone, such as `properties` or `items`, or
 * skipped by it, and the one on the schema it ends at. A `$ref` schema's own keywords are kept over its target's where
 * the two are read merged, so with `skipsRefs` set a list keyword both of them hold below a `$ref`, such as an `allOf`
 * inside a property both declare, indexes the merged list. Without it, a key the `$ref` schema holds itself is read as
 * written when the rest of the path runs through a key merging doesn't join. Where a merge along the chain fails, a key
 * the `$ref` schema doesn't hold itself is read from its target, and the schema the path ends at is kept as written.
 *
 * @param rootSchema - The form's root schema
 * @param schemaPath - The URI fragment of the JSON Pointer to the keyword that failed, such as `#/properties/a/required`
 * @param [decodeSchemaPathKey] - Decodes a key of the `schemaPath`, for an engine that escapes them; they are read as
 *        written without it
 * @param [skipsRefs=false] - The engine leaves every `$ref` out of the path, so a key after a `$ref` schema can index
 *        either that schema or its target
 * @returns - The schema holding the keyword; `null` when `skipsRefs` is set and the path skips a chain of `$ref`s two
 *          of whose schemas hold its next key, unless it is `properties`, `patternProperties`, `additionalProperties`,
 *          `propertyNames`, or an `items`, `prefixItems` or `additionalItems` merging joins, a whole schema or
 *          position by position, with the rest of the path running through keys merging joins, so which of them the
 *          path's next key indexes can't be told; or `undefined` when the path isn't a URI fragment, or leads to no
 *          schema object, such as the `properties` map holding the property a `false` schema's path ends at, or
 *          through a `$ref` that can't be resolved
 */
export default function getKeywordParentSchema<S extends StrictRJSFSchema = RJSFSchema>(
  rootSchema: S,
  schemaPath: string,
  decodeSchemaPathKey: (key: string) => string = (key) => key,
  skipsRefs = false,
): S | null | undefined {
  // Ajv starts the path of a keyword in another resource with that resource's `$id`, which isn't read from the root
  if (!schemaPath.startsWith('#')) {
    return undefined;
  }
  try {
    const graph = parseSchemaGraph<S>(rootSchema);
    let node: unknown = rootSchema;
    let seeds: object[] = [];
    let endsAtNameMap = false;
    const keys = schemaPath.split('/').slice(1, -1).map(decodeSchemaPathKey);
    const keyword = decodeSchemaPathKey(schemaPath.slice(schemaPath.lastIndexOf('/') + 1));
    for (let index = 0; index < keys.length; index++) {
      const key = keys[index];
      const hasRef = stringKeyword(node, REF_KEY) !== undefined;
      if (hasRef && key === REF_KEY && index < keys.length - 1) {
        // The keys after a `$ref` the path names index into its target, which merging in the `$ref` schema's own
        // `allOf` or `oneOf` would shift, there or further down. A path on through keys merging joins alone is read
        // merged from the first `$ref` of the chain it names, for the titles of every schema along it, unless the merge
        // failed and moved them into an `allOf`
        let refs = 1;
        while (keys[index + refs] === REF_KEY) {
          refs += 1;
        }
        const rest = keys.slice(index + refs);
        const own = ownRef<S>(graph, seeds, node as S);
        if (readsJoined(rest) && (rest.length === 0 || Object.hasOwn(own.resolved, rest[0]))) {
          node = own.resolved;
          seeds = own.seeds;
          index += refs - 1;
        } else {
          node = own.target;
        }
      } else {
        if (
          hasRef &&
          skipsRefs &&
          !MERGE_COMBINED_KEYS.includes(key) &&
          // Merging joins an `items`, `prefixItems` or `additionalItems` too, a whole schema or position by position, but
          // not a list keyword further down that both schemas hold
          !readsJoined(keys.slice(index))
        ) {
          // Any two schemas along the chain of `$ref`s holding the key make the path ambiguous
          let holders = 0;
          for (let link: unknown = node; link !== undefined;) {
            holders += Number(Object.hasOwn(Object(link), key));
            link = stringKeyword(link, REF_KEY) === undefined ? undefined : ownRef<S>(graph, seeds, link as S).target;
          }
          if (holders > 1) {
            return null;
          }
        }
        // Merging reorders a key the `$ref` schema holds itself, such as `anyOf` crossed with its target's, or moves it
        // into an `allOf`, so the path's next key indexes the schema as written. One merging joins is read merged, for
        // the target's titles, where the rest of the path runs through keys merging joins too, or the engine skips the
        // `$ref` and the path can index either side, unless the merge failed and moved it into an `allOf` too
        for (let reading = hasRef; reading;) {
          reading = false;
          if (
            key === REF_KEY ||
            (MERGE_JOINED_KEYS.includes(key) && (skipsRefs || readsJoined(keys.slice(index)))) ||
            !Object.hasOwn(Object(node), key)
          ) {
            const own = ownRef<S>(graph, seeds, node as S);
            if (own.failed && key !== REF_KEY && !Object.hasOwn(Object(node), key)) {
              // The failed merge's `allOf` isn't the target's, so a key only the target holds is read from the target,
              // the same way again where the target holds a `$ref` too
              node = own.target;
              reading = stringKeyword(node, REF_KEY) !== undefined;
            } else if (key === REF_KEY || !Object.hasOwn(Object(node), key) || Object.hasOwn(own.resolved, key)) {
              node = own.resolved;
              seeds = own.seeds;
            }
          }
        }
        // `resolveOwnRef()` follows a whole chain of `$ref`s, each of which the path can name. A property named `$ref`
        // is still read, as a key the schema holds
        if (key !== REF_KEY || Object.hasOwn(Object(node), REF_KEY)) {
          node = getByPath(node, key);
          // A list is kept, for the seeds at the position the next key names
          seeds = seeds.flatMap((seed) => {
            const sub: unknown = getByPath(seed, key);
            return typeof sub === 'object' && sub !== null ? [sub] : [];
          });
        }
      }
      endsAtNameMap = !endsAtNameMap && NAME_MAP_KEYS.includes(key);
    }
    if (stringKeyword(node, REF_KEY) !== undefined) {
      const { resolved, failed } = ownRef<S>(graph, seeds, node as S);
      // A merge that fails moves the keyword into an `allOf`, away from the `$ref` schema's own title, which a merge
      // keeps over its target's. The `$ref` itself is never kept by a merge
      node = keyword !== REF_KEY && failed ? node : resolved;
    }
    return isObject(node) && !endsAtNameMap ? (node as S) : undefined;
  } catch {
    // `resolveOwnRef()` throws for a `$ref` it can't resolve, such as one naming an `$anchor`
    return undefined;
  }
}
