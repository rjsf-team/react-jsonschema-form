import { REF_KEY } from './constants.ts';
import KeyedMemo from './schema/graph/keyedMemo.ts';
import { schemaFrom } from './schema/graph/mergePlan.ts';
import { resolveOwnRef } from './schema/retrieveSchema.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** The `{ $ref }` each reference is resolved through, by root and reference: `resolveOwnRef()` memoizes on the schema
 * holding the reference, so one per reference shares its result, and the parse of it, across calls
 */
const references = new KeyedMemo<StrictRJSFSchema>();

/** The `{ $ref }` for `$ref` in `rootSchema`, the same object on every call */
function referenceOf<S extends StrictRJSFSchema>(rootSchema: S, $ref: string): S;
function referenceOf(rootSchema: StrictRJSFSchema, $ref: string): StrictRJSFSchema {
  return references.get([rootSchema, $ref], () => schemaFrom(rootSchema, { [REF_KEY]: $ref }));
}

/** The root a `$ref` is looked up in when the caller passes none, which no `$ref` names anything in */
function emptySchema<S extends StrictRJSFSchema>(): S;
function emptySchema(): StrictRJSFSchema {
  return {};
}

/** Returns the definition `$ref` names in `rootSchema`, resolved through the schema graph as the form resolves a
 * field's `$ref`: a JSON pointer, an `$anchor` or the `$id` of an embedded resource, each resolved against the `$id`s
 * around it, with every `$ref` below the target followed, the annotations beside a followed `$ref` read over the
 * target's and any other keywords beside it merged with the target as the `allOf` of both. The result is shared across
 * calls and marked with `RJSF_REF_KEY`, so copy it rather than changing it.
 *
 * @param [$ref] - The `$ref` to resolve
 * @param [rootSchema={}] - The root schema the `$ref` names a definition of
 * @returns - The definition the `$ref` names
 * @throws - `Could not find a definition for …` for a `$ref` that names nothing, and `Definition for … is a circular
 *        reference` for a chain of `$ref`s that loops back on itself
 * @deprecated Resolve a `$ref` as the form does with `schemaUtils.retrieveSchema({ $ref })`, which this wraps for
 *        callers written against 6.x
 */
export default function findSchemaDefinition<S extends StrictRJSFSchema = RJSFSchema>(
  $ref?: string,
  rootSchema: S = emptySchema<S>(),
): S {
  return resolveOwnRef<S>(referenceOf(rootSchema, $ref ?? ''), rootSchema);
}
