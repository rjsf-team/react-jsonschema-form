import { ALL_OF_KEY, EXTRA_KEYS_ELSEWHERE_FLAG, UNEVALUATED_PROPERTIES_KEY } from './constants.ts';
import getSchemaType from './getSchemaType.ts';
import isObject, { isSchemaObject } from './isObject.ts';
import KeyedMemo from './schema/graph/keyedMemo.ts';
import { schemaFrom } from './schema/graph/mergePlan.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from './types.ts';

/** The compiled form of every `patternProperties` pattern seen so far, so that testing a key against one costs no
 * compile of its own. A schema names a small, fixed set of patterns, where the keys they are tested against are the
 * form data's: every render of an object filters each of its keys by each of its patterns, as does every prune of its
 * data, so a map of a few thousand keys compiled the same handful of patterns thousands of times over on every
 * keystroke in it.
 */
const compiledPatterns = new Map<string, RegExp>();

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
export function patternRegExp(pattern: string): RegExp {
  const cached = compiledPatterns.get(pattern);
  if (cached !== undefined) {
    return cached;
  }
  let compiled: RegExp;
  try {
    compiled = RegExp(pattern, 'u');
  } catch {
    compiled = RegExp(pattern);
  }
  // Neither flag is one that gives a `RegExp` a `lastIndex` for `test()` to read, so the compiled pattern answers for
  // one key the way it answers for the next
  compiledPatterns.set(pattern, compiled);
  return compiled;
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

/** Returns whether the form reads an object naming neither `additionalProperties` nor `unevaluatedProperties` as
 * taking any key its other keywords leave over, as `additionalProperties: true` does: the JSON Schema spec reads it that
 * way, and the context's `additionalPropertiesWhenAbsent: 'allow'` has the form follow it. A schema that is no object,
 * an untyped `{}` included, has no keys for the form to offer or keep, and an option `getRenderedOptionSchema()` marked
 * `EXTRA_KEYS_ELSEWHERE_FLAG` leaves them to its parent's own field.
 *
 * @param context - The `SchemaContext` whose `additionalPropertiesWhenAbsent` decides
 * @param schema - The schema to check
 * @returns - True when the object's absent keyword takes any extra key
 */
export function absentKeywordAllows<
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, schema: S): boolean {
  return (
    context.additionalPropertiesWhenAbsent === 'allow' &&
    !Reflect.get(schema, EXTRA_KEYS_ELSEWHERE_FLAG) &&
    additionalPropertiesKeyword<S>(schema) === undefined &&
    getSchemaType<S>(schema) === 'object'
  );
}

/** Returns whether an object takes keys its own `properties` don't name, which is what makes asking
 * `getAdditionalPropertySchema()` about such a key worth it at all: `retrieveSchema()` stubs the extra keys the form
 * data holds only for an object that takes them, `canExpand()` offers the add button only for one, and `ObjectField`
 * adds a property only to one.
 *
 * A `patternProperties` naming a pattern says the object takes them, whatever an `additionalProperties: false` beside
 * it says about the names no pattern matches, since the names a pattern matches are the object's to take all the same.
 * Otherwise the keyword that describes those names answers, as long as it does not reject them. An object naming none
 * of the three keywords takes any key as far as a validator is concerned, which the form follows only where the
 * context's `additionalPropertiesWhenAbsent` is `'allow'`, see `absentKeywordAllows()`. An empty `patternProperties`
 * names no pattern, so it matches no name and describes no key the object could take, the way an empty `properties`
 * declares none.
 *
 * @param context - The `SchemaContext` whose `additionalPropertiesWhenAbsent` says what an absent keyword means
 * @param schema - The object schema to check
 * @returns - True when the object takes keys beyond the ones its `properties` name
 */
export function allowsAdditionalProperties<
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(context: SchemaContext<S, F>, schema: S): boolean {
  if (Object.keys(schema.patternProperties ?? {}).length > 0) {
    return true;
  }
  const keyword = additionalPropertiesKeyword<S>(schema);
  return keyword === undefined ? absentKeywordAllows<S, F>(context, schema) : keyword !== false;
}

/** The `allOf` of the patterns a key matches, by those patterns */
const patternConjunctions = new KeyedMemo<object>();

/** Returns the `allOf` of `patterns`, the same object for every key the same patterns match: a reader that keys its
 * work on the schema it is handed, as `omitExtraData()` merges an `allOf` once per object, would otherwise do it again
 * for every key on every render
 *
 * @param template - A schema of the type to return, whose keywords are not copied
 * @param patterns - The pattern subschemas the key matches
 * @returns - The `allOf` of the patterns
 */
function patternConjunction<S extends StrictRJSFSchema>(template: S, patterns: readonly unknown[]): S {
  const known = patternConjunctions.peek(patterns);
  if (isSchemaObject<S>(known)) {
    return known;
  }
  const conjunction = schemaFrom(template, { [ALL_OF_KEY]: patterns });
  patternConjunctions.set(patterns, conjunction);
  return conjunction;
}

/** Returns the subschema a key has to meet under both `own` and `other`, which each describe it, allow it (`true`
 * or `undefined`) or forbid it (`false`)
 *
 * @param own - What one schema says of the key
 * @param other - What the other says of it
 * @returns - What the two say of it together
 */
export function conjoin(own: unknown, other: unknown): unknown {
  if (own === undefined || own === true) {
    return other ?? own;
  }
  if (other === undefined || other === true) {
    return own;
  }
  return own === false || other === false ? false : { [ALL_OF_KEY]: [own, other] };
}

/** The object schema and the option selected beside it that a schema joins the extra-key keywords of */
export const JOINED_SCHEMAS_KEY = Symbol('__rjsf_joined_schemas');

/** Returns `joined`, which joins the extra-key keywords of an object schema, `own`, and of the option selected beside
 * it, `option`, carrying the two so that `getAdditionalPropertySchema()` asks each of them about a key on its own: the
 * keywords of one say nothing about a key the other's patterns or extra-key keywords evaluate, which no one set of
 * keywords can say. Either may carry a join of its own, which is asked apart in turn.
 *
 * @param joined - The schema with the two schemas' extra-key keywords joined
 * @param own - The object schema's extra-key keywords
 * @param option - The extra-key keywords of the option selected beside it
 * @returns - The joined schema, carrying the two it joins
 */
export function withJoinedSchemas<S extends StrictRJSFSchema = RJSFSchema>(joined: S, own: S, option: S): S {
  return { ...joined, [JOINED_SCHEMAS_KEY]: { own, option } };
}

/** Returns what `schema` says of a `key` its own `properties` don't name, or undefined where it names nothing that
 * describes the key; `readsUnevaluated` is false where something beside the schema evaluates the key, which leaves its
 * `unevaluatedProperties` nothing to say about it
 */
function describesKey<S extends StrictRJSFSchema>(schema: S, key: string, readsUnevaluated: boolean): unknown {
  if (schema.patternProperties) {
    const matchingPatterns: unknown[] = Object.values(getMatchingPatternProperties<S>(schema, key));
    if (matchingPatterns.length > 0) {
      return matchingPatterns.includes(false) ? false : patternConjunction<S>(schema, matchingPatterns);
    }
  }
  return additionalPropertiesKeyword<S>(
    readsUnevaluated ? schema : { ...schema, [UNEVALUATED_PROPERTIES_KEY]: undefined },
  );
}

/** Returns the schema an object says applies to a `key` its own `properties` don't name, so that everything that
 * renders such a property, seeds it or decides whether it is allowed at all reads one answer rather than its own. A key
 * one or more `patternProperties` patterns match is described by all of them together, returned as an `allOf` for the
 * caller to resolve into the one schema that describes it, the same object for every key the same patterns match; a
 * `false` among them rejects the key whatever the others allow, since no value satisfies it. A key no pattern matches
 * is `additionalProperties`' to describe, `false` and `true` included, which `additionalPropertiesKeyword()` reads with
 * the precedence the keywords have.
 *
 * A schema `retrieveSchema()` joined with the option selected beside it answers for the object and for the option
 * apart, and conjoins the two: the object's `unevaluatedProperties` says nothing about a key the option evaluates.
 * Either of the two may be a join itself, as an option offering options of its own is, and is asked apart in turn.
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
  const answer = joinedDescribesKey<S>(schema, key, true);
  return typeof answer === 'boolean' || isSchemaObject<S>(answer) ? answer : true;
}

/** Returns what `schema` says of `key` as `describesKey()` does, asking each of the schemas a joined one joins apart,
 * and each of theirs where one of them was joined in turn, as an option offering options of its own is
 */
function joinedDescribesKey<S extends StrictRJSFSchema>(schema: S, key: string, readsUnevaluated: boolean): unknown {
  const joined: unknown = Reflect.get(schema, JOINED_SCHEMAS_KEY);
  if (!isObject(joined) || !isSchemaObject<S>(joined.own) || !isSchemaObject<S>(joined.option)) {
    return describesKey<S>(schema, key, readsUnevaluated);
  }
  const optionSays = joinedDescribesKey<S>(joined.option, key, readsUnevaluated);
  return conjoin(joinedDescribesKey<S>(joined.own, key, readsUnevaluated && optionSays === undefined), optionSays);
}
