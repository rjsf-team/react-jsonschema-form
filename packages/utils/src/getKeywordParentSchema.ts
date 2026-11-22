import { ADDITIONAL_PROPERTIES_KEY, PATTERN_PROPERTIES_KEY, PROPERTIES_KEY, REF_KEY } from './constants.ts';
import isObject from './isObject.ts';
import { getByPath } from './pathUtils.ts';
import { stringKeyword } from './schema/graph/parseSchemaGraph.ts';
import { requireOwnRef, resolveOwnRef } from './schema/retrieveSchema.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Keywords whose subschemas merging a `$ref` schema with its target combines into one, so a path reads the same
 * schema whichever of the two it indexes. Merging reorders, replaces or moves into `allOf` every other one */
const MERGE_COMBINED_KEYS = [PROPERTIES_KEY, PATTERN_PROPERTIES_KEY, ADDITIONAL_PROPERTIES_KEY, 'propertyNames'];

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
 *          or `propertyNames`, so which of them the path indexes can't be told; or `undefined` when the path leads to
 *          no schema object or through a `$ref` that can't be resolved
 */
export default function getKeywordParentSchema<S extends StrictRJSFSchema = RJSFSchema>(
  rootSchema: S,
  schemaPath: string,
  decodeSchemaPathKey: (key: string) => string = (key) => key,
  skipsRefs = false,
): S | null | undefined {
  try {
    let node: unknown = rootSchema;
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
        if (hasRef) {
          // The resolved schema holds the `$ref` schema's own keywords too, so a key it holds itself is still read
          node = resolveOwnRef<S>(node as S, rootSchema);
        }
        // `resolveOwnRef()` follows a whole chain of `$ref`s, each of which the path can name. A property named `$ref`
        // is still read, as a key the schema holds
        if (key !== REF_KEY || Object.hasOwn(Object(node), REF_KEY)) {
          node = getByPath(node, key);
        }
      }
    }
    if (stringKeyword(node, REF_KEY) !== undefined) {
      node = resolveOwnRef<S>(node as S, rootSchema);
    }
    return isObject(node) ? (node as S) : undefined;
  } catch {
    // `resolveOwnRef()` throws for a `$ref` it can't resolve, such as one naming an `$anchor`
    return undefined;
  }
}
