import type { RJSFSchema } from '../../src/index.ts';
import { mergeSchemas } from '../../src/index.ts';

/** The `oneOf` options that `titleChoiceMergeAllOf()` rewrites, as a schema parsed with the default merge leaves them */
export const CHOICE: RJSFSchema = { oneOf: [{ const: 'a' }, { const: 'b' }] };

/** A schema whose `p` is both a named property and a `patternProperties` match, so resolving it merges
 * `{ allOf: [p, ...patterns] }` -- the one merge made for a schema that has no `allOf` of its own
 */
export const SCHEMA_MERGED_FOR_PATTERN_PROPERTY: RJSFSchema = {
  type: 'object',
  properties: { p: { type: 'object', properties: { x: { type: 'string' } } } },
  patternProperties: { '^p$': { properties: { choice: CHOICE } } },
};

/** Form data that selects the `choice` option which `SCHEMA_MERGED_FOR_PATTERN_PROPERTY` only has once merged */
export const MERGED_PATTERN_PROPERTY_FORM_DATA = { p: { choice: 'b' } };

/** A `customMergeAllOf` that titles the `choice` options of the schema it merges, so the options a form validates
 * against differ from the ones the default merge produces, and hash differently
 */
export function titleChoiceMergeAllOf(schema: RJSFSchema): RJSFSchema {
  const { allOf, ...rest } = schema;
  const merged = (allOf as RJSFSchema[]).reduce((acc, s) => mergeSchemas(acc, s) as RJSFSchema, rest);
  const choice = merged.properties?.choice as RJSFSchema | undefined;
  if (!choice?.oneOf) {
    return merged;
  }
  const oneOf = choice.oneOf.map((o) => ({ ...(o as RJSFSchema), title: `Option ${(o as RJSFSchema).const}` }));
  return { ...merged, properties: { ...merged.properties, choice: { ...choice, oneOf } } };
}

/** The titled `choice` option that only `titleChoiceMergeAllOf()` produces */
export const TITLED_CHOICE_OPTION = { const: 'b', title: 'Option b' };
