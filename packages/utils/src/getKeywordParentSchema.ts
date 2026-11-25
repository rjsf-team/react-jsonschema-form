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
import { stringKeyword } from './schema/graph/parseSchemaGraph.ts';
import { requireOwnRef, resolveOwnRef } from './schema/retrieveSchema.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Keywords whose subschemas merging a `$ref` schema with its target combines into one, so a path reads the same
 * schema whichever of the two it indexes. Merging reorders, replaces or moves into `allOf` every other one */
const MERGE_COMBINED_KEYS = [PROPERTIES_KEY, PATTERN_PROPERTIES_KEY, ADDITIONAL_PROPERTIES_KEY, 'propertyNames'];

/** Keywords whose subschemas merging joins with the target's, a whole schema or position by position, so the merged
 * schema holds the titles of both. An index after `prefixItems` or a tuple `items` reads the same position either way */
const MERGE_JOINED_KEYS = [...MERGE_COMBINED_KEYS, ITEMS_KEY, PREFIX_ITEMS_KEY, ADDITIONAL_ITEMS_KEY];

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
 * target alone, or skipped by it, and the one on the schema it ends at. A `$ref` schema's own keywords are kept over its
 * target's where the two are read merged.
 *
 * @param rootSchema - The form's root schema
 * @param schemaPath - The URI fragment of the JSON Pointer to the keyword that failed, such as `#/properties/a/required`
 * @param [decodeSchemaPathKey] - Decodes a key of the `schemaPath`, for an engine that escapes them; they are read as
 *        written without it
 * @param [skipsRefs=false] - The engine leaves every `$ref` out of the path, so a key after a `$ref` schema can index
 *        either that schema or its target
 * @returns - The schema holding the keyword; `null` when `skipsRefs` is set and the path skips a chain of `$ref`s two
 *          of whose schemas hold its next key, unless it is `properties`, `patternProperties`, `additionalProperties`
 *          or `propertyNames`, so which of them the path indexes can't be told; or `undefined` when the path isn't a
 *          URI fragment, or leads to no schema object, such as the `properties` map holding the property a `false`
 *          schema's path ends at, or through a `$ref` that can't be resolved
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
    let node: unknown = rootSchema;
    let endsAtNameMap = false;
    const keys = schemaPath.split('/').slice(1, -1).map(decodeSchemaPathKey);
    for (const [index, key] of keys.entries()) {
      const hasRef = stringKeyword(node, REF_KEY) !== undefined;
      if (hasRef && key === REF_KEY && index < keys.length - 1) {
        // The keys after a `$ref` the path names index into its target, which merging in the `$ref` schema's own
        // `allOf`, `oneOf` or `items` would shift
        node = requireOwnRef<S>(node as S, rootSchema).target;
      } else {
        if (hasRef && skipsRefs && !MERGE_COMBINED_KEYS.includes(key)) {
          // Any two schemas along the chain of `$ref`s holding the key make the path ambiguous
          let holders = 0;
          for (let link: unknown = node; link !== undefined;) {
            holders += Number(Object.hasOwn(Object(link), key));
            link =
              stringKeyword(link, REF_KEY) === undefined ? undefined : requireOwnRef<S>(link as S, rootSchema).target;
          }
          if (holders > 1) {
            return null;
          }
        }
        // Merging reorders a key the `$ref` schema holds itself, such as `anyOf` crossed with its target's, or moves it
        // into an `allOf`, so the path's next key indexes the schema as written. One merging joins is read merged, for
        // the target's titles, unless the merge failed and moved it into an `allOf` too
        if (hasRef && (key === REF_KEY || MERGE_JOINED_KEYS.includes(key) || !Object.hasOwn(Object(node), key))) {
          const resolved = resolveOwnRef<S>(node as S, rootSchema);
          node = key !== REF_KEY && Object.hasOwn(Object(node), key) && !Object.hasOwn(resolved, key) ? node : resolved;
        }
        // `resolveOwnRef()` follows a whole chain of `$ref`s, each of which the path can name. A property named `$ref`
        // is still read, as a key the schema holds
        if (key !== REF_KEY || Object.hasOwn(Object(node), REF_KEY)) {
          node = getByPath(node, key);
        }
      }
      endsAtNameMap = !endsAtNameMap && NAME_MAP_KEYS.includes(key);
    }
    if (stringKeyword(node, REF_KEY) !== undefined) {
      node = resolveOwnRef<S>(node as S, rootSchema);
    }
    return isObject(node) && !endsAtNameMap ? (node as S) : undefined;
  } catch {
    // `resolveOwnRef()` throws for a `$ref` it can't resolve, such as one naming an `$anchor`
    return undefined;
  }
}
