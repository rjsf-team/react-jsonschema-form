import { ADDITIONAL_PROPERTIES_KEY, UNEVALUATED_PROPERTIES_KEY } from './constants.ts';
import type { GenericObjectType, RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Determines whether `schema` forbids a property that neither its `properties` nor its `patternProperties` describe.
 * An `additionalProperties: false` says so directly. An `unevaluatedProperties: false` says the same thing for a
 * schema that names no `additionalProperties` at all: every key the `properties` and `patternProperties` leave over
 * goes unevaluated, and that keyword rejects exactly those. Any `additionalProperties`, `true` and a schema alike,
 * evaluates those keys itself, which leaves `unevaluatedProperties` nothing to reject and so no say here.
 *
 * Only a literal `false` forbids. An `unevaluatedProperties` schema describes what such a key may hold rather than
 * ruling it out, so the key is allowed, and the data it holds is what it renders from, the way it does under an
 * `additionalProperties` the schema leaves out.
 *
 * @param schema - The object schema whose additional properties are in question
 * @returns - True when a key the schema does not otherwise describe is one it forbids
 */
export default function forbidsAdditionalProperties<S extends StrictRJSFSchema = RJSFSchema>(schema: S): boolean {
  if (ADDITIONAL_PROPERTIES_KEY in schema) {
    return schema.additionalProperties === false;
  }
  return (schema as GenericObjectType)[UNEVALUATED_PROPERTIES_KEY] === false;
}
