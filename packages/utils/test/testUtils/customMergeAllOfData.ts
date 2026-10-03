import type { GenericObjectType, RJSFSchema } from '../../src/index.ts';
import { isObject, mergeSchemas } from '../../src/index.ts';

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

/** A schema with no named properties, whose `patternProperties` describe every key starting with `x`. A form renders a
 * key the form data brings with the `{ allOf: [...matching patterns] }` that `stubExistingAdditionalProperties()`
 * resolves, so the sub-schemas it validates against are that merge's, not the pattern's
 */
export const SCHEMA_MERGED_FOR_PATTERN_KEY: RJSFSchema = {
  type: 'object',
  patternProperties: { '^x': { type: 'object', properties: { choice: CHOICE } } },
};

/** Form data whose extra `x1` key selects the `choice` option that only the merge of the matching patterns produces */
export const MERGED_PATTERN_KEY_FORM_DATA = { x1: { choice: 'b' } };

/** A `customMergeAllOf` that titles the `choice` options of the schema it merges, so the options a form validates
 * against differ from the ones the default merge produces, and hash differently
 */
export function titleChoiceMergeAllOf(schema: RJSFSchema): RJSFSchema {
  const { allOf = [], ...rest } = schema;
  const merged: GenericObjectType = allOf.reduce<GenericObjectType>(
    // A boolean subschema constrains nothing this merge has to carry over
    (acc, subSchema) => (isObject(subSchema) ? mergeSchemas(acc, subSchema) : acc),
    rest,
  );
  const choice = merged.properties?.choice;
  if (!isObject(choice) || !Array.isArray(choice.oneOf)) {
    return merged;
  }
  const oneOf = choice.oneOf.filter(isObject).map((option) => ({ ...option, title: `Option ${option.const}` }));
  return { ...merged, properties: { ...merged.properties, choice: { ...choice, oneOf } } };
}

/** The titled `choice` option that only `titleChoiceMergeAllOf()` produces */
export const TITLED_CHOICE_OPTION = { const: 'b', title: 'Option b' };
