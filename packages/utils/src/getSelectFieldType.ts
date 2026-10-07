import { JSON_SCHEMA_TYPES } from './constants.ts';

/** Gets the type of the field that renders a select over values of the given `types`: the one non-null type JSON
 * Schema defines that it names, or a `string` when it names several or none. Mixed types can't share a typed field
 * (`NumberField` would cast a string option to a number), and an all-`null` select would reach `NullField`, which
 * renders nothing, while `StringField`'s select maps each option back to its original constant, so a `string` can
 * represent any of them. A repeated or unrecognized name is no second type, so a select over an `['integer', 'foo']`
 * is the `integer` that `getSchemaType()` resolves it to.
 *
 * @param types - The `type` list of a select, or the distinct `guessType()` results of its constants
 * @returns - The type of the field that renders the select
 */
export default function getSelectFieldType(types: readonly string[]): string {
  const knownTypes = JSON_SCHEMA_TYPES.filter((type) => type !== 'null' && types.includes(type));
  return knownTypes.length === 1 ? knownTypes[0] : 'string';
}
