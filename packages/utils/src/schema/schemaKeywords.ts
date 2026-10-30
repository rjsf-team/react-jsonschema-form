import { ADDITIONAL_PROPERTIES_KEY, PATTERN_PROPERTIES_KEY, UNEVALUATED_PROPERTIES_KEY } from '../constants.ts';

/** The keywords that constrain a value of a given type without naming the type itself. A typeless `additionalProperties`
 * subschema carrying any of them constrains the property it describes, so the property is not free to hold any type.
 */
const VALUE_KEYWORDS: string[] = [
  'enum',
  'const',
  'format',
  'minLength',
  'maxLength',
  'pattern',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'items',
  'prefixItems',
  'additionalItems',
  'contains',
  'minContains',
  'maxContains',
  'minItems',
  'maxItems',
  'uniqueItems',
  'properties',
  'patternProperties',
  'additionalProperties',
  'propertyNames',
  'required',
  'dependentRequired',
  'minProperties',
  'maxProperties',
];

/** The keywords that constrain a value by way of other subschemas. They assert something about the value as surely as
 * the `VALUE_KEYWORDS` do, but they are left out of the guessed-type stub `retrieveSchema()` builds for an additional
 * property: an `allOf` naming a type of its own would contradict the type the stub takes from the data and fail to
 * merge on every render, and the validator enforces them either way.
 */
const SUBSCHEMA_KEYWORDS: string[] = [
  'allOf',
  'anyOf',
  'oneOf',
  'not',
  'if',
  'then',
  'else',
  'dependencies',
  'dependentSchemas',
  'unevaluatedItems',
  'unevaluatedProperties',
  '$ref',
  '$dynamicRef',
  '$recursiveRef',
];

/** The keywords that identify a subschema rather than describe a value. The stub is built once per property, so
 * copying them would give every sibling property the same identifier — and an `$id` naming a registered field would
 * route them all to it.
 */
export const IDENTIFIER_KEYWORDS: string[] = ['$id', '$anchor', '$dynamicAnchor', '$schema', '$vocabulary'];

/** The keywords that hold other subschemas for a `$ref` to name rather than describe a value. The stub drops the
 * `$ref` that would reach them, so copying them into every property would hand each one an unreachable copy that
 * `hashForSchema()` and `deepEquals()` then walk on every render.
 */
export const CONTAINER_KEYWORDS: string[] = ['$defs', 'definitions'];

/** The keywords describing an object's extra keys */
export const EXTRA_KEY_KEYWORDS = [ADDITIONAL_PROPERTIES_KEY, PATTERN_PROPERTIES_KEY, UNEVALUATED_PROPERTIES_KEY];

/** Every keyword that constrains the value, for the reasons the first two lists above give. They are only ever
 * consulted together, once per key a schema holds, so they are consulted as one.
 */
const CONSTRAINING_KEYWORDS = new Set<string>([...VALUE_KEYWORDS, ...SUBSCHEMA_KEYWORDS]);

/** Whether `keyword` of a schema constrains the value it describes, directly or by way of other subschemas. `type` does
 * not count, nor does an annotation, an identifier, a container such as `$defs`, a `discriminator` or any keyword
 * outside JSON Schema's validation vocabulary, such as an `x-` extension: none of those rejects a value
 *
 * @param keyword - The keyword
 * @returns - True when the keyword constrains the value
 */
export function constrainsValue(keyword: string): boolean {
  return CONSTRAINING_KEYWORDS.has(keyword);
}

/** The keywords no stub carries, whatever the stub keeps of the rest, for the reasons the two lists above give: both
 * reasons are about building a stub once per property key, not about what the stub then says of the value.
 */
export const UNSTUBBABLE_KEYWORDS = new Set<string>([...IDENTIFIER_KEYWORDS, ...CONTAINER_KEYWORDS]);

/** Every keyword a guessed-type stub leaves out, for the reasons the three lists above give. They are only ever
 * consulted together, and once per property key, so they are consulted as one.
 */
export const EXCLUDED_STUB_KEYWORDS = new Set<string>([...SUBSCHEMA_KEYWORDS, ...UNSTUBBABLE_KEYWORDS]);
