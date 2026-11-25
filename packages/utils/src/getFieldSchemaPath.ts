import {
  ALL_OF_KEY,
  ANY_OF_KEY,
  DEFINITIONS_KEY,
  DEPENDENCIES_KEY,
  DEPENDENT_SCHEMAS_KEY,
  ELSE_KEY,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  PROPERTIES_KEY,
  REF_KEY,
  THEN_KEY,
} from './constants.ts';

const BRANCH_LIST_KEYS = new Set([ALL_OF_KEY, ANY_OF_KEY, ONE_OF_KEY]);
const BRANCH_MAP_KEYS = new Set([DEPENDENT_SCHEMAS_KEY, DEPENDENCIES_KEY]);
const NAME_MAP_KEYS = new Set([PROPERTIES_KEY, PATTERN_PROPERTIES_KEY, '$defs', DEFINITIONS_KEY]);

/** Used by the validator packages to name a property by the field a failed keyword applies to. Returns the `schemaPath`
 * with the branches the keyword sits in removed: each `allOf`, `anyOf` or `oneOf` option, `then`, `else`, and
 * `dependentSchemas` or `dependencies` schema, along with any `$ref` written into the path after one. A branch's own
 * `title` names that branch, not the field, and a branch that only lists `required` holds no `properties` to look one up
 * in. The path is walked from the root, so a property, definition or dependency named like a keyword, such as `then` or
 * `properties`, is read as the name it is.
 *
 * @param schemaPath - The URI fragment of the JSON Pointer to the keyword that failed, such as `#/properties/a/then/type`
 * @returns - The path the keyword would have if the field held it, such as `#/properties/a/type`, or the `schemaPath` as
 *          it is when the keyword sits in no branch
 */
export default function getFieldSchemaPath(schemaPath: string): string {
  const segments = schemaPath.split('/');
  const last = segments.length - 1;
  let branchStart: number | undefined;
  for (let index = 1; index < last; index++) {
    const segment = segments[index];
    const isBranch =
      BRANCH_LIST_KEYS.has(segment) || BRANCH_MAP_KEYS.has(segment) || segment === THEN_KEY || segment === ELSE_KEY;
    branchStart = isBranch || (segment === REF_KEY && branchStart !== undefined) ? (branchStart ?? index) : undefined;
    // The next segment is an index or a name, never a keyword
    if (BRANCH_LIST_KEYS.has(segment) || BRANCH_MAP_KEYS.has(segment) || NAME_MAP_KEYS.has(segment)) {
      index += 1;
    }
  }
  return branchStart === undefined ? schemaPath : [...segments.slice(0, branchStart), segments[last]].join('/');
}
