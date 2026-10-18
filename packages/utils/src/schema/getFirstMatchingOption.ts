import {
  allowsAdditionalProperties,
  isStubbedProperty,
  withoutStubbedProperties,
} from '../additionalPropertiesUtils.ts';
import { ALL_OF_KEY, ID_KEY, JUNK_OPTION_ID, PROPERTIES_KEY, REQUIRED_KEY } from '../constants.ts';
import getOptionMatchingSimpleDiscriminator from '../getOptionMatchingSimpleDiscriminator.ts';
import hashForSchema from '../hashForSchema.ts';
import isObject from '../isObject.ts';
import { getByPath } from '../pathUtils.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';

/** The suffix `withVariantId()` adds to an `$id`, matched at the end so deriving a variant of a variant replaces it
 * rather than stacking another one on
 */
const VARIANT_ID_SUFFIX = /\?rjsf=[^?]*$/;

/** Returns the `schema` with any `$id` it carries replaced by one derived from it and from the schema's own content. A
 * schema derived from an option -- augmented for scoring, or relaxed -- is not the schema that the option's `$id`
 * names, and a validator caches the function it compiles for a schema under that `$id`, so an unchanged `$id` would
 * validate the derived schema against the option's own function. The original `$id` is kept as the base of the derived
 * one because a relative `$ref` that the schema left for the validator to resolve resolves against it.
 *
 * @param schema - The schema derived from one that may carry an `$id`
 * @returns - The schema, carrying an `$id` that names it rather than the one it was derived from
 */
export function withVariantId<S extends StrictRJSFSchema = RJSFSchema>(schema: S): S {
  const id = schema[ID_KEY];
  if (!id) {
    return schema;
  }
  const { [ID_KEY]: _id, ...withoutId } = schema;
  return { ...schema, [ID_KEY]: variantId(id, withoutId) };
}

/** Returns the schema a retrieved `option` is checked against the data by, as `MultiSchemaField` does when a parent
 * declines an option switch: the option without the properties `retrieveSchema()` stubbed into it for the keys of the
 * data, under the `$id` `withVariantId()` derives from that content. The stubs only render the keys, and the keyword
 * that takes each key decides whether its value fits. `schemaParser()` records this same schema for each option it
 * retrieves, so that a precompiled validator has it compiled.
 *
 * @param option - The retrieved option
 * @returns - The schema to check the option against the data by
 */
export function declineCheckSchema<S extends StrictRJSFSchema = RJSFSchema>(option: S): S {
  return withVariantId<S>(withoutStubbedProperties<S>(option) ?? option);
}

/** Returns the `$id` naming a schema of the given `content` derived from the schema `id` names.
 *
 * @param id - The `$id` of the schema the derived one came from
 * @param content - The content the derived `$id` names, which it is hashed from
 * @returns - The derived `$id`
 */
function variantId(id: unknown, content: object): string {
  // Relative resolution replaces the last path segment and drops the query, so a `$ref` inside the schema resolves
  // against the same base the original `$id` gave it. The suffix goes in the query because an `$id` that already has
  // one still parses, where a second fragment would not. A suffix this already added is replaced rather than appended
  // to, so deriving from a schema that is itself derived -- scoring an option whose `additionalProperties` was relaxed
  // -- stays based on the `$id` the original carried rather than stacking a suffix per derivation
  // An `$id` is typed as a string but an untyped JS caller can hand over anything, and a non-string one is reported
  // as a validation error rather than thrown on, so it is converted rather than called into. An empty trailing
  // fragment goes with the suffix it would otherwise swallow: `a.json#` would become `a.json#?rjsf=...`, putting the
  // query inside the fragment, where the 2019-09 and 2020-12 meta-schemas require an `$id` to match `^[^#]*#?$`. Both
  // drafts allow the empty fragment, and it is common in schemas carried over from draft-04
  const base = String(id).replace(VARIANT_ID_SUFFIX, '').replace(/#$/, '');
  return `${base}?rjsf=${hashForSchema(content as RJSFSchema)}`;
}

/** The schema each option is scored by, memoized by the option it was derived from. Deriving it hashes the option, and
 * an option is scored again on every change to the form data -- `MultiSchemaField` re-matches its options as the data
 * changes, and `omitExtraData()` scores them per call -- so without this a large option is serialized on every
 * keystroke.
 *
 * This keys by the object the caller hands over, so it hits only where that object is stable across calls, which is
 * where an option is scored as `MultiSchemaField` has it: `retrieveSchema()` answers from its own cache while what it
 * resolves is unchanged. It misses where a caller rebuilds the option per call, which is what
 * `getClosestMatchingOption()` and `omitExtraData()` do for an option with a `$ref` anywhere inside it --
 * `resolveAllReferences()` returns a new object whenever it resolves anything -- so such an option is still derived
 * once per call. A schema is read rather than written wherever it is scored, so an entry stays the derivation of
 * its key
 */
const scoringSchemas = new WeakMap<StrictRJSFSchema, StrictRJSFSchema>();

/** Returns the schema the given `option` is scored by. An object option is matched more strictly than it describes
 * itself: unless it uses `required`, an object validates against it as long as it has no key of a conflicting type, so
 * an `anyOf` of the keys it declares is added, asserting that the data holds at least one of them, and the `required`
 * it does declare is dropped, since the keys a user has yet to fill in would fail it.
 *
 * Whatever carries the option's `$id` onward carries one derived from its own content instead, since it is not the
 * schema that `$id` names and a validator caches the function it compiles under it.
 *
 * @param option - The option that is about to be passed to `isValid()` for scoring
 * @returns - The schema to score the option by
 */
function scoringSchema<S extends StrictRJSFSchema = RJSFSchema>(option: S, formData: unknown): S {
  // An `anyOf`/`oneOf` entry may be a boolean schema, which declares nothing to augment or to name, and a primitive
  // cannot key the memo either -- `WeakMap.set()` throws on one
  if (!isObject(option)) {
    return option;
  }
  // Both memos are looked up before the stubs are stripped, since an option is scored again on every change to the
  // data and stripping copies it
  const memoized = scoringSchemas.get(option);
  if (memoized) {
    return memoized as S;
  }
  if (!stubbedScoringSchemas.has(option)) {
    const unstubbed = withoutStubbedProperties<S>(option);
    if (!unstubbed) {
      const scored = augmentedForScoring<S>(option);
      scoringSchemas.set(option, scored);
      return scored;
    }
    stubbedScoringSchemas.set(option, { unstubbed });
  }
  return stubbedScoringSchema<S>(option, formData);
}

/** The scoring schema for an option that describes no keys at all. `normalizeBooleanSchema()` reads a `false`
 * subschema as this, which is the same statement: nothing validates against it.
 */
const MATCHES_NOTHING: StrictRJSFSchema = { not: {} };

/** Returns the `option` with the `anyOf` of its own property names that scoring an object option needs, or the option
 * itself, under a derived `$id`, when it declares no `properties` to build one from.
 *
 * An option that carries an `$id` names a document that a `$ref` inside it can resolve back to -- `$ref: ''` names the
 * document itself -- so for one of those the assertion is held in a wrapper around the option rather than merged into
 * it. Merged in, it would reach every child the option describes through such a reference, and there it asserts
 * nothing: a child is a value the option holds, not another option the data is being matched against. The wrapper
 * needs no `$id`, since a schema without one is keyed by its hash, and the option it holds keeps a derived one so that
 * the reference resolves to the option rather than to the wrapper.
 *
 * @param option - The option to augment for scoring
 * @returns - The schema asserting the option and the keys scoring it needs
 */
function augmentedForScoring<S extends StrictRJSFSchema = RJSFSchema>(option: S): S {
  // Only an option that declares `properties` describes an object whose keys scoring can assert. One that declares
  // none describes something else -- a string, a number, a map -- and is scored as it stands
  if (!option[PROPERTIES_KEY]) {
    return withVariantId<S>(option);
  }
  const propertyNames = Object.keys(option[PROPERTIES_KEY]);
  if (propertyNames.length === 0) {
    // An option describing a map declares an empty `properties` by the time it is scored, since
    // `stubExistingAdditionalProperties()` puts one there for the keys the data holds, and it is scored as it stands:
    // an `anyOf` over no names is not a stricter schema but an unsatisfiable one, which AJV rejects as invalid,
    // failing a whole precompile with `data/anyOf must NOT have fewer than 1 items`.
    //
    // An option that describes no keys at all has nothing for scoring to match on either way, and scored as it stands
    // it matches every object, so a "none of these" option in front of the real ones takes the data away from them. It
    // is scored by a schema that matches nothing, which is what the unsatisfiable `anyOf` said and what a `false`
    // subschema says, while being a schema a validator accepts rather than one that fails the compile
    // Whether the option describes keys its `properties` does not name is the question `allowsAdditionalProperties()`
    // answers for every object the form renders, an option included, so it answers it here too
    return allowsAdditionalProperties<S>(option) ? withVariantId<S>(option) : (MATCHES_NOTHING as S);
  }
  const requiresAnyOf = { anyOf: propertyNames.map((key) => ({ required: [key] })) };
  const { [ID_KEY]: id, [REQUIRED_KEY]: _required, ...content } = option;
  // The junk option is left to the path below, which keeps the `$id` at the top of the schema: the precompiled
  // validators recognise that one by its `$id` and answer it without a compiled function at all
  if (id && id !== JUNK_OPTION_ID) {
    // The `$id` names the schema the option is scored by, so the assertion is hashed into it even though it is held
    // outside: a precompiled validator compiles this alongside the option under the `$id` `withVariantId()` derives
    // for it on its own, and two schemas cannot share one `$id`. The assertion is appended to the `allOf` for the
    // hash rather than merged in, so that an `anyOf` the option declares still tells it apart from another option
    const scoringId = variantId(id, { ...content, [ALL_OF_KEY]: [...(content.allOf ?? []), requiresAnyOf] });
    const wrapped: StrictRJSFSchema = { allOf: [{ ...content, [ID_KEY]: scoringId }], ...requiresAnyOf };
    return wrapped as S;
  }
  // `content` is already the option without the `required` that scoring drops. The `$id` goes back on because this
  // path is the one that keeps it at the top of the schema, where the junk option is recognised by it
  const base = ID_KEY in option ? { [ID_KEY]: id, ...content } : content;
  // An `anyOf` the option already declares is left as it is, with the augmentation wrapped in an `allOf` so both apply
  return (
    option.anyOf ? { ...base, allOf: [...(content.allOf ?? []), requiresAnyOf] } : { ...base, ...requiresAnyOf }
  ) as S;
}

/** An option that `retrieveSchema()` stubbed keys of the form data into without those stubs, and the two schemas it
 * can be scored by, each derived the first time it is needed
 */
interface StubbedScoring {
  unstubbed: StrictRJSFSchema;
  /** The schema for data holding a defined value for a stubbed key */
  withDataKeys?: StrictRJSFSchema;
  /** The schema for data holding none */
  withoutDataKeys?: StrictRJSFSchema;
}

/** The `StubbedScoring` of each option that has stubs, memoized by the retrieved option, as `scoringSchemas` is */
const stubbedScoringSchemas = new WeakMap<StrictRJSFSchema, StubbedScoring>();

/** Returns the schema to score an `option` that `retrieveSchema()` stubbed keys of the form data into by, given the
 * option without those stubs. The stubs only render the keys: a stub can accept a value the keyword that takes its key
 * rejects, and its key is whatever the user typed, which no precompiled validator can have compiled. So the option is
 * scored without them, and the keyword decides each key's value.
 *
 * A stubbed key satisfies the `anyOf` of the option's names that scoring asserts only while it holds a defined value,
 * since `required` treats `undefined` as missing. That is checked here, in JS, so the schema scored still depends on
 * the option alone: data holding a defined value for a stubbed key is scored by the option without the `anyOf`, and
 * other data by the option without stubs, as any other option is. An option that declares no names of its own is
 * then left with only the stubbed ones, which object data holding none of them fails, as v7's `anyOf` of them did.
 *
 * @param option - The retrieved option, with its stubbed properties, whose `StubbedScoring` is memoized
 * @param formData - The data being scored
 * @returns - The schema to score the option by
 */
function stubbedScoringSchema<S extends StrictRJSFSchema = RJSFSchema>(option: S, formData: unknown): S {
  const memo = stubbedScoringSchemas.get(option)!;
  const properties = option[PROPERTIES_KEY] as Record<string, unknown>;
  const data = isObject(formData) ? (formData as Record<string, unknown>) : undefined;
  const holdsStubbedKey =
    data !== undefined &&
    Object.keys(properties).some((key) => isStubbedProperty(properties[key]) && data[key] !== undefined);
  const unstubbed = memo.unstubbed as S;
  if (holdsStubbedKey) {
    memo.withDataKeys ??= scoringSchemaWithDataKeys<S>(unstubbed);
    return memo.withDataKeys as S;
  }
  // The stubbed keys hold `undefined` here, so of the names v7 asserted only the declared ones can be met. With none
  // declared, v7's `anyOf` of the stubbed names failed for object data, rather than the option matching every object
  // as one with an empty `properties` does
  if (data !== undefined && !hasDeclaredNames(unstubbed)) {
    return MATCHES_NOTHING as S;
  }
  memo.withoutDataKeys ??= augmentedForScoring<S>(unstubbed);
  return memo.withoutDataKeys as S;
}

/** Returns whether the `option` declares any property names of its own in `properties`.
 *
 * @param option - The option, without the properties `retrieveSchema()` stubbed into it
 * @returns - True when its `properties` names at least one key
 */
function hasDeclaredNames<S extends StrictRJSFSchema = RJSFSchema>(option: S): boolean {
  const properties = option[PROPERTIES_KEY];
  return isObject(properties) && Object.keys(properties).length > 0;
}

/** Returns the schema an object option is scored by while object data holds keys its `patternProperties` or
 * `additionalProperties` take, all of them `undefined`, when the option declares no names of its own: one that matches
 * nothing. `schemaParser()` records it for such an option, so that a precompiled validator has it compiled.
 *
 * @param option - A retrieved object option, without the properties stubbed into it
 * @returns - The schema matching nothing when the option declares no names, or undefined when it declares some
 */
export function scoringSchemaWithUndefinedDataKeys<S extends StrictRJSFSchema = RJSFSchema>(option: S): S | undefined {
  return hasDeclaredNames<S>(option) ? undefined : (MATCHES_NOTHING as S);
}

/** Returns the schema an object option is scored by while the data holds a defined value for a key its
 * `patternProperties` or `additionalProperties` take, given the option without the properties `retrieveSchema()`
 * stubbed in for those keys. That key satisfies the `anyOf` of the option's names that scoring asserts, so the option
 * is scored without one, and without its `required`, which scoring drops, under a derived `$id`, as for any other
 * schema scoring derives from an option.
 *
 * `schemaParser()` scores each retrieved option that takes such keys in this form as well, so that a precompiled
 * validator has it compiled.
 *
 * @param option - A retrieved object option, without the properties stubbed into it
 * @returns - The schema the option is scored by while the data holds a defined value for a key it takes
 */
export function scoringSchemaWithDataKeys<S extends StrictRJSFSchema = RJSFSchema>(option: S): S {
  const { [REQUIRED_KEY]: _required, ...content } = option;
  return withVariantId<S>(content as S);
}

/** Given the `formData` and list of `options`, attempts to find the index of the first option that matches the data.
 * Always returns the first option if there is nothing that matches.
 *
 * @param context - The `SchemaContext` whose `validator` is used to match the options
 * @param formData - The current formData, if any, used to figure out a match
 * @param options - The list of options to find a matching options from
 * @param rootSchema - The root schema, used to primarily to look up `$ref`s
 * @param [discriminatorField] - The optional name of the field within the options object whose value is used to
 *          determine which option is selected
 * @returns - The index of the first matched option or 0 if none is available
 */
export default function getFirstMatchingOption<
  T = unknown,
  S extends StrictRJSFSchema = RJSFSchema,
  F extends FormContextType = FormContextType,
>(
  context: SchemaContext<S, F>,
  formData: T | undefined,
  options: S[],
  rootSchema: S,
  discriminatorField?: string,
): number {
  // For performance, skip validating subschemas if formData is undefined. We just
  // want to get the first option in that case.
  if (formData === undefined) {
    return 0;
  }

  const simpleDiscriminatorMatch = getOptionMatchingSimpleDiscriminator(formData, options, discriminatorField);
  if (typeof simpleDiscriminatorMatch === 'number') {
    return simpleDiscriminatorMatch;
  }

  for (let i = 0; i < options.length; i += 1) {
    const option = options[i];

    // If we have a discriminator field, then we will use this to make the determination. A discriminator the option
    // doesn't declare, but that `retrieveSchema()` stubbed in for the key of the data, says nothing about the option:
    // the option is scored without its stubs instead, as any other option is
    const discriminator = discriminatorField
      ? (option[PROPERTIES_KEY]?.[discriminatorField] as S | undefined)
      : undefined;
    if (discriminatorField && discriminator !== undefined && !isStubbedProperty(discriminator)) {
      const value = getByPath<T>(formData, discriminatorField);
      if (context.validator.isValid(discriminator, value, rootSchema)) {
        return i;
      }
    } else if (context.validator.isValid(scoringSchema<S>(option, formData), formData, rootSchema)) {
      return i;
    }
  }
  return 0;
}
