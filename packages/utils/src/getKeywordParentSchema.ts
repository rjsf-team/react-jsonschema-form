import { REF_KEY } from './constants.ts';
import isObject from './isObject.ts';
import { getByPath } from './pathUtils.ts';
import { stringKeyword } from './schema/graph/parseSchemaGraph.ts';
import { requireOwnRef, resolveOwnRef } from './schema/retrieveSchema.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

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
 * @returns - The schema holding the keyword, or `undefined` when the path leads to no schema object or through a
 *          `$ref` that can't be resolved
 */
export default function getKeywordParentSchema<S extends StrictRJSFSchema = RJSFSchema>(
  rootSchema: S,
  schemaPath: string,
  decodeSchemaPathKey: (key: string) => string = (key) => key,
): S | undefined {
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
