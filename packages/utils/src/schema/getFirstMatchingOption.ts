import { ID_KEY, JUNK_OPTION_ID, PROPERTIES_KEY } from '../constants.ts';
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
  const { [ID_KEY]: id, ...withoutId } = schema;
  if (!id) {
    return schema;
  }
  // Relative resolution replaces the last path segment and drops the query, so a `$ref` inside the schema resolves
  // against the same base the original `$id` gave it. The suffix goes in the query because an `$id` that already has
  // one still parses, where a second fragment would not. A suffix this already added is replaced rather than appended
  // to, so deriving twice -- relaxing an option and then scoring the relaxed one -- names the same schema both times
  // An `$id` is typed as a string but an untyped JS caller can hand over anything, and a non-string one is reported as
  // a validation error rather than thrown on, so it is converted rather than called into
  // oxlint-disable-next-line typescript/no-unnecessary-type-conversion
  const base = String(id).replace(VARIANT_ID_SUFFIX, '');
  return { ...schema, [ID_KEY]: `${base}?rjsf=${hashForSchema(withoutId)}` };
}

/** The schema each option is scored by, memoized by the option it was derived from. Deriving it hashes the option, and
 * an option is scored again on every change to the form data -- `MultiSchemaField` re-matches its options as the data
 * changes, and `omitExtraData()` scores them per call -- so without this a large option is serialized on every
 * keystroke. What a caller hands over is the same object each time for this to key by: `retrieveSchema()` answers from
 * its own cache while what it resolves is unchanged, and `relaxOptionsForScoring()` memoizes the one option it has to
 * build. A schema is read rather than written wherever it is scored, so an entry stays the derivation of its key
 */
const scoringSchemas = new WeakMap<StrictRJSFSchema, StrictRJSFSchema>();

/** Returns the schema the given `option` is scored by. An object option is matched more strictly than it describes
 * itself: unless it uses `required`, an object validates against it as long as it has no key of a conflicting type, so
 * an `anyOf` of the keys it declares is added, asserting that the data holds at least one of them, and the `required`
 * it does declare is dropped, since the keys a user has yet to fill in would fail it.
 *
 * The result carries an `$id` derived from its own content rather than the option's, since it is not the schema that
 * `$id` names and a validator caches the function it compiles under it. The junk option is left alone: the precompiled
 * validators recognise that one by its own `$id` and answer it without a compiled function at all.
 *
 * @param option - The option that is about to be passed to `isValid()` for scoring
 * @returns - The schema to score the option by
 */
function scoringSchema<S extends StrictRJSFSchema = RJSFSchema>(option: S): S {
  // An `anyOf`/`oneOf` entry may be a boolean schema, which declares nothing to augment or to name, and a primitive
  // cannot key the memo either -- `WeakMap.set()` throws on one
  if (!isObject(option)) {
    return option;
  }
  const memoized = scoringSchemas.get(option);
  if (memoized) {
    return memoized as S;
  }
  const augmented = augmentedForScoring<S>(option);
  const scored = option[ID_KEY] === JUNK_OPTION_ID ? augmented : withVariantId<S>(augmented);
  scoringSchemas.set(option, scored);
  return scored;
}

/** Returns the `option` with the `anyOf` of its own property names that scoring an object option needs, or the option
 * itself when it declares no `properties` to build one from.
 *
 * @param option - The option to augment for scoring
 * @returns - The option, augmented when it describes an object
 */
function augmentedForScoring<S extends StrictRJSFSchema = RJSFSchema>(option: S): S {
  if (!option[PROPERTIES_KEY]) {
    return option;
  }
  const requiresAnyOf = {
    anyOf: Object.keys(option[PROPERTIES_KEY]).map((key) => ({
      required: [key],
    })),
  };
  // An `anyOf` the option already declares is left as it is, with the augmentation wrapped in an `allOf` so both apply
  const augmentedSchema = option.anyOf
    ? ({ ...option, allOf: [...(option.allOf ?? []), requiresAnyOf] } as S)
    : ({ ...option, ...requiresAnyOf } as S);
  delete augmentedSchema.required;
  return augmentedSchema;
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

    // If we have a discriminator field, then we will use this to make the determination
    const discriminator = discriminatorField
      ? (option[PROPERTIES_KEY]?.[discriminatorField] as S | undefined)
      : undefined;
    if (discriminatorField && discriminator !== undefined) {
      const value = getByPath<T>(formData, discriminatorField);
      if (context.validator.isValid(discriminator, value, rootSchema)) {
        return i;
      }
    } else if (context.validator.isValid(scoringSchema<S>(option), formData, rootSchema)) {
      return i;
    }
  }
  return 0;
}
