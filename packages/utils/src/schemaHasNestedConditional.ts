import {
  ADDITIONAL_PROPERTIES_KEY,
  ALL_OF_KEY,
  ANY_OF_KEY,
  DEPENDENCIES_KEY,
  IF_KEY,
  ITEMS_KEY,
  ONE_OF_KEY,
  PATTERN_PROPERTIES_KEY,
  PROPERTIES_KEY,
  REF_KEY,
} from './constants.ts';
import findSchemaDefinition from './findSchemaDefinition.ts';
import isObject from './isObject.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Recursively checks whether the given raw `schema` contains a `dependencies` or `if` keyword anywhere below its
 * top level, e.g. inside a nested object's `properties`, a `$ref`, an array's tuple `items`, or a
 * `patternProperties` entry. `retrieveSchema()` only resolves the `dependencies`/`if` declared directly on the
 * schema it is given, so a root-level retrieved schema never reflects a conditional branch switch that happens
 * deeper in the tree. `Form` uses this to detect when a comparison of root-level retrieved schemas can't be trusted
 * to decide whether sanitization is needed.
 *
 * @param schema - The raw schema node to search
 * @param rootSchema - The root schema, used to resolve any `$ref`s encountered while searching
 * @param [atRoot=true] - Whether `schema` is the root of the search, whose own `dependencies`/`if` don't count
 * @param [seenRefs=[]] - The `$ref`s already resolved along this branch of the search, to guard against cycles
 * @returns - True if a `dependencies` or `if` keyword exists below the root of the schema
 */
export default function schemaHasNestedConditional<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S | boolean | undefined,
  rootSchema: S,
  atRoot = true,
  seenRefs: string[] = [],
): boolean {
  if (!isObject(schema)) {
    return false;
  }
  let resolved: S = schema;
  let refs = seenRefs;
  if (typeof resolved[REF_KEY] === 'string') {
    const ref: string = resolved[REF_KEY];
    if (refs.includes(ref)) {
      return false;
    }
    refs = [...refs, ref];
    try {
      const target = findSchemaDefinition<S>(ref, rootSchema);
      if (isObject(target)) {
        // Merge, don't replace: sibling keywords declared alongside `$ref` are preserved and applied by
        // `retrieveSchema()` (via `{ ...refSchema, ...localSchema }`), so a local `dependencies`/`if` next to a
        // `$ref` must still be seen here, not just ones found on the ref target.
        const { [REF_KEY]: _ref, ...localSchema } = resolved;
        resolved = { ...target, ...localSchema } as S;
      }
    } catch {
      // An unresolvable $ref will already have surfaced elsewhere (e.g. when rendering the field); treat it as
      // having no nested conditional here rather than letting this best-effort check throw.
      return false;
    }
  }
  if (!atRoot && (DEPENDENCIES_KEY in resolved || IF_KEY in resolved)) {
    return true;
  }
  const properties = resolved[PROPERTIES_KEY];
  const patternProperties = resolved[PATTERN_PROPERTIES_KEY];
  const items = resolved[ITEMS_KEY] as S | boolean | (S | boolean)[] | undefined;
  const nestedSchemas: (S | boolean | undefined)[] = [
    ...(isObject(properties) ? (Object.values(properties) as (S | boolean)[]) : []),
    ...(isObject(patternProperties) ? (Object.values(patternProperties) as (S | boolean)[]) : []),
    ...(Array.isArray(items) ? items : [items]),
    resolved[ADDITIONAL_PROPERTIES_KEY] as S | boolean | undefined,
    ...((resolved[ALL_OF_KEY] as (S | boolean)[] | undefined) ?? []),
    ...((resolved[ANY_OF_KEY] as (S | boolean)[] | undefined) ?? []),
    ...((resolved[ONE_OF_KEY] as (S | boolean)[] | undefined) ?? []),
  ];
  return nestedSchemas.some((nested) => schemaHasNestedConditional(nested, rootSchema, false, refs));
}
