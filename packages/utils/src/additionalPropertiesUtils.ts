import { ALL_OF_KEY, UNEVALUATED_PROPERTIES_KEY } from './constants.ts';
import type { RJSFSchema, StrictRJSFSchema } from './types.ts';

/** Compiles a `patternProperties` pattern the way a validator compiles it, with the `u` flag: Ajv's `unicodeRegExp` is
 * on by default and `@cfworker/json-schema` compiles every pattern under it, so without the flag a `\p{Lu}` is the
 * literal text `p{Lu}` and the keys the form describes, allows and seeds through a pattern are not the keys validation
 * accepts.
 *
 * A pattern that flag rejects — a `\-` or a `[\w-.]`, which it reads as escapes no longer allowed — is compiled
 * unflagged rather than left to throw: the throw would come from whatever reads the object, which is every render of
 * one and every prune of its data, taking the form down over a pattern only validation has anything to say about. One
 * no flag compiles throws as it always has, a schema no reader of it can make sense of.
 *
 * @param pattern - The `patternProperties` pattern to compile
 * @returns - The compiled pattern
 */
function patternRegExp(pattern: string): RegExp {
  try {
    return RegExp(pattern, 'u');
  } catch {
    return RegExp(pattern);
  }
}

/** Returns the subset of 'patternProperties' specifications that match the given 'key'
 *
 * @param schema - The schema whose 'patternProperties' are to be filtered
 * @param key - The key to match against the 'patternProperties' specifications
 * @returns - The subset of 'patternProperties' specifications that match the given 'key'
 */
export function getMatchingPatternProperties<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  key: string,
): Required<S['patternProperties']> {
  const patternProperties = schema.patternProperties ?? {};
  return Object.fromEntries(
    Object.entries(patternProperties).filter(([pattern]) => patternRegExp(pattern).test(key)),
  ) as Required<S['patternProperties']>;
}

/** Returns what an object's `additionalProperties` says about the keys its `properties` and `patternProperties` leave
 * over, or what its `unevaluatedProperties` says where it names no `additionalProperties` at all: those keys are
 * exactly the ones that go unevaluated, so that keyword is what then describes or rejects them, while any
 * `additionalProperties`, `true` and a schema alike, evaluates them itself and leaves `unevaluatedProperties` nothing
 * to say about them. Either keyword spelled `undefined`, as a schema built by spreading tends to spell one, reads as
 * absent the way a validator reads it, so neither hides what the other says.
 *
 * The two are read off a schema typed to declare them: `unevaluatedProperties` is a 2019-09 keyword that `JSONSchema7`
 * does not declare, and the subschema either one holds is an `S` the way every other subschema of an `S` is.
 *
 * It is exported for `omitExtraData()` rather than for consumers, so that the keys the form renders and seeds through
 * one of these keywords are the keys it keeps.
 *
 * @param schema - The object schema whose keyword is desired
 * @returns - What the keyword says, or undefined where the object names neither
 */
export function additionalPropertiesKeyword<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
): S | boolean | undefined {
  const typedSchema = schema as S & { additionalProperties?: S | boolean; unevaluatedProperties?: S | boolean };
  // `??` falls through on an absent keyword alone, so a `false` either of them spells is the answer it gives
  return typedSchema.additionalProperties ?? typedSchema[UNEVALUATED_PROPERTIES_KEY];
}

/** Returns whether an object takes keys its own `properties` don't name, which is what makes asking
 * `getAdditionalPropertySchema()` about such a key worth it at all: `retrieveSchema()` stubs the extra keys the form
 * data holds only for an object that takes them, `canExpand()` offers the add button only for one, and `ObjectField`
 * adds a property only to one.
 *
 * A `patternProperties` naming a pattern says the object takes them, whatever an `additionalProperties: false` beside
 * it says about the names no pattern matches, since the names a pattern matches are the object's to take all the same.
 * Otherwise the keyword that describes those names answers, as long as it neither rejects them nor is missing: an
 * object naming none of the three keywords takes any key as far as a validator is concerned, but the form has no schema
 * to render one with and no name to add one under, so it offers none. An empty `patternProperties` names no pattern, so
 * it matches no name and describes no key the object could take, the way an empty `properties` declares none.
 *
 * @param schema - The object schema to check
 * @returns - True when the object takes keys beyond the ones its `properties` name
 */
export function allowsAdditionalProperties<S extends StrictRJSFSchema = RJSFSchema>(schema: S): boolean {
  if (Object.keys(schema.patternProperties ?? {}).length > 0) {
    return true;
  }
  const keyword = additionalPropertiesKeyword<S>(schema);
  return keyword !== undefined && keyword !== false;
}

/** Returns the schema an object says applies to a `key` its own `properties` don't name, so that everything that
 * renders such a property, seeds it or decides whether it is allowed at all reads one answer rather than its own. A key
 * one or more `patternProperties` patterns match is described by all of them together, returned as an `allOf` for the
 * caller to resolve into the one schema that describes it; a `false` among them rejects the key whatever the others
 * allow, since no value satisfies it. A key no pattern matches is `additionalProperties`' to describe, `false` and
 * `true` included, which `additionalPropertiesKeyword()` reads with the precedence the keywords have.
 *
 * @param schema - The object schema the `key` is a property of
 * @param key - The property name whose schema is desired
 * @returns - `false` for a key the object forbids, `true` for one it allows without describing, and otherwise the
 *          subschema describing it, whose `$ref`s are left for the caller to resolve
 */
export function getAdditionalPropertySchema<S extends StrictRJSFSchema = RJSFSchema>(
  schema: S,
  key: string,
): S | boolean {
  if (schema.patternProperties) {
    const matchingPatterns = Object.values(getMatchingPatternProperties<S>(schema, key)) as (S | boolean)[];
    if (matchingPatterns.length > 0) {
      return matchingPatterns.includes(false) ? false : ({ [ALL_OF_KEY]: matchingPatterns } as S);
    }
  }
  return additionalPropertiesKeyword<S>(schema) ?? true;
}
