import type { JSONSchema7 } from 'json-schema';

/**
 * This file is used to augment the `json-schema` module with the keywords RJSF reads beyond draft 7: `deprecated` and
 * the other keywords of later drafts it supports, OpenAPI's `discriminator`, and Ajv's `formatMinimum`/`formatMaximum`.
 *
 * It is a dedicated file because `json-schema` is a type-only package. Standard augmentation
 * using `import 'json-schema'` in a file with other imports can cause module resolution
 * errors in certain environments (like Jest). Using `import type` in this dedicated file
 * ensures the augmentation is correctly applied by the TypeScript compiler without
 * confusing runtime module resolvers.
 */
declare module 'json-schema' {
  export interface JSONSchema7 {
    /** The deprecated keyword is a boolean that indicates that the instance value the keyword applies to should not be
     * used and may be removed in the future.
     */
    deprecated?: boolean;
    /** A plain-name fragment identifier for the schema (draft 2019-09) */
    $anchor?: string;
    /** A dynamic-scope fragment identifier for the schema (draft 2020-12) */
    $dynamicAnchor?: string;
    /** A reference resolved in the dynamic scope, to the schema whose `$dynamicAnchor` it names (draft 2020-12) */
    $dynamicRef?: string;
    /** A reference resolved in the dynamic scope of the schemas marked `$recursiveAnchor` (draft 2019-09) */
    $recursiveRef?: string;
    /** The vocabularies a meta-schema uses, by URI, each `true` when it is required (draft 2019-09) */
    $vocabulary?: Record<string, boolean>;
    /** The schema of the decoded content of a string, with its `contentMediaType` (draft 2019-09) */
    contentSchema?: JSONSchema7Definition;
    /** The properties the presence of a property requires, by that property's name (draft 2019-09) */
    dependentRequired?: Record<string, string[]>;
    /** The subschema the presence of a property applies, by that property's name (draft 2019-09) */
    dependentSchemas?: Record<string, JSONSchema7Definition>;
    /** The property whose value selects the `oneOf`/`anyOf` option (OpenAPI) */
    discriminator?: { propertyName: string; mapping?: Record<string, string> };
    /** The latest date or time the value may hold, for a `format` that has an order, or Ajv's `$data` reference to one
     * when Ajv runs with `$data` (Ajv's `ajv-formats`)
     */
    formatMaximum?: string | { $data: string };
    /** The earliest date or time the value may hold, for a `format` that has an order, or Ajv's `$data` reference to one
     * when Ajv runs with `$data` (Ajv's `ajv-formats`)
     */
    formatMinimum?: string | { $data: string };
    /** The most items that may match `contains` (draft 2019-09) */
    maxContains?: number;
    /** The fewest items that must match `contains` (draft 2019-09) */
    minContains?: number;
    /** The schemas of the array's leading items, by position (draft 2020-12) */
    prefixItems?: JSONSchema7Definition[];
    /** The schema of the items no other keyword evaluates (draft 2019-09) */
    unevaluatedItems?: JSONSchema7Definition;
    /** The schema of the properties no other keyword evaluates (draft 2019-09) */
    unevaluatedProperties?: JSONSchema7Definition;
  }
}

export type { JSONSchema7 };
