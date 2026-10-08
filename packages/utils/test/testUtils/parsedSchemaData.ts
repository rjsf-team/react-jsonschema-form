import type { RJSFSchema } from '../../src/index.ts';

/** A `customMergeAllOf` that leaves its input exactly as it is, standing in for any merge that leaves entries in the
 * `allOf` -- one that can hoist a single `if`/`then`/`else` and no more, say
 */
export function identityMergeAllOf(schema: RJSFSchema): RJSFSchema {
  return schema;
}

/** A schema whose nested object carries an `allOf`. A form merges it to render the object, but `getObjectDefaults()`
 * reads the unmerged `properties` to compute the object's defaults, so the `choice` options it scores are the ones a
 * `customMergeAllOf` rewrites
 */
export const SCHEMA_NESTED_ALL_OF: RJSFSchema = {
  type: 'object',
  properties: {
    outer: {
      type: 'object',
      properties: { choice: { oneOf: [{ const: 'a' }, { const: 'b' }] } },
      allOf: [{ properties: { q: { type: 'string' } } }],
    },
  },
};

/** Form data whose `choice` is the option `SCHEMA_NESTED_ALL_OF` only scores unmerged */
export const NESTED_ALL_OF_FORM_DATA = { outer: { choice: 'b' } };

/** A schema whose `allOf` a merge can leave in place. `omitExtraData()` walks the entries that are still there after
 * the merge and scores the options of each, so those options are validated against unmerged
 */
export const SCHEMA_UNMERGED_ALL_OF: RJSFSchema = {
  type: 'object',
  allOf: [
    {
      properties: {
        choice: {
          oneOf: [
            { type: 'object', properties: { k: { const: 'a' } } },
            { type: 'object', properties: { k: { const: 'b' } } },
          ],
        },
      },
    },
    { properties: { q: { type: 'string' } } },
  ],
};

/** Form data with a key under `choice` and one at the root that `SCHEMA_UNMERGED_ALL_OF` does not describe */
export const UNMERGED_ALL_OF_FORM_DATA = { choice: { k: 'b', z: 1 }, q: 'x', extra: 1 };

/** What `omitExtraData()` keeps of `UNMERGED_ALL_OF_FORM_DATA` */
export const UNMERGED_ALL_OF_OMITTED = { choice: { k: 'b' }, q: 'x' };

/** The `oneOf` options of `SCHEMA_ONE_OF_ALL_OF_REF`, exported so a test can retrieve and score them the way
 * `MultiSchemaField` does without digging them back out of the schema
 */
export const ONE_OF_ALL_OF_REF_OPTIONS: RJSFSchema[] = [{ $ref: '#/definitions/Cat' }, { $ref: '#/definitions/Dog' }];

/** A schema reaching `SCHEMA_UNMERGED_ALL_OF` through a condition, where resolution merges the `allOf` before the
 * parse ever sees it, so the entries `omitExtraData()` walks are only on what resolution returns
 */
export const SCHEMA_CONDITIONAL_UNMERGED_ALL_OF: RJSFSchema = {
  type: 'object',
  properties: { u: { if: { required: ['zz'] }, then: SCHEMA_UNMERGED_ALL_OF, else: SCHEMA_UNMERGED_ALL_OF } },
};

/** Form data for `SCHEMA_CONDITIONAL_UNMERGED_ALL_OF`, which qualifies neither branch of the condition */
export const CONDITIONAL_UNMERGED_ALL_OF_FORM_DATA = { u: UNMERGED_ALL_OF_FORM_DATA };

/** What `omitExtraData()` keeps of `CONDITIONAL_UNMERGED_ALL_OF_FORM_DATA` */
export const CONDITIONAL_UNMERGED_ALL_OF_OMITTED = { u: UNMERGED_ALL_OF_OMITTED };

/** A schema whose dependency is a `oneOf`. `omitExtraData()` scores those options itself, where resolving the
 * dependency only validates the conditions `withExactlyOneSubschema()` builds out of them
 */
export const SCHEMA_DEPENDENCY_ONE_OF: RJSFSchema = {
  type: 'object',
  properties: { pet: { type: 'string', enum: ['No', 'Yes'] } },
  dependencies: {
    pet: {
      oneOf: [
        { properties: { pet: { enum: ['No'] } } },
        { properties: { pet: { enum: ['Yes'] }, age: { type: 'number' } }, required: ['age'] },
      ],
    },
  },
};

/** Form data for `SCHEMA_DEPENDENCY_ONE_OF` picking its second option, with a key the schema does not describe */
export const DEPENDENCY_ONE_OF_FORM_DATA = { pet: 'Yes', age: 3, extra: 1 };

/** What `omitExtraData()` keeps of `DEPENDENCY_ONE_OF_FORM_DATA` */
export const DEPENDENCY_ONE_OF_OMITTED = { pet: 'Yes', age: 3 };

/** A schema whose `oneOf` options are `$ref`s to a definition that is an `allOf`. `MultiSchemaField` scores the
 * options it has retrieved, which for `Cat` is the merge of that `allOf` rather than the `$ref` the schema declares
 */
export const SCHEMA_ONE_OF_ALL_OF_REF: RJSFSchema = {
  definitions: {
    Cat: {
      allOf: [
        { type: 'object', properties: { meow: { type: 'string' } } },
        { properties: { lives: { type: 'number' } } },
      ],
    },
    Dog: { type: 'object', properties: { bark: { type: 'string' } } },
  },
  type: 'object',
  properties: { pet: { oneOf: ONE_OF_ALL_OF_REF_OPTIONS } },
};

/** A schema whose two `patternProperties` both match a key of `ab`, so a form renders that key with the merge of the
 * two and scores the options of that merge, which neither pattern has on its own
 */
export const SCHEMA_TWO_MATCHING_PATTERNS: RJSFSchema = {
  type: 'object',
  patternProperties: {
    '^a': {
      oneOf: [
        { type: 'object', properties: { x: { type: 'string' } } },
        { type: 'object', properties: { y: { type: 'number' } } },
      ],
    },
    '^ab': {
      oneOf: [
        { type: 'object', properties: { z: { type: 'string' } } },
        { type: 'object', properties: { w: { type: 'number' } } },
      ],
    },
  },
};

/** Form data whose `ab` key matches both of `SCHEMA_TWO_MATCHING_PATTERNS`'s patterns */
export const TWO_MATCHING_PATTERNS_FORM_DATA = { ab: { x: 'q' } };
