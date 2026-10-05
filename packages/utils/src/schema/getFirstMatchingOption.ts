import { ID_KEY, JUNK_OPTION_ID, PROPERTIES_KEY } from '../constants.ts';
import getOptionMatchingSimpleDiscriminator from '../getOptionMatchingSimpleDiscriminator.ts';
import hashForSchema from '../hashForSchema.ts';
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
  return { ...schema, [ID_KEY]: `${base}?rjsf=${hashForSchema(withoutId as S)}` };
}

/** Applies `withVariantId()` to a schema about to be scored, leaving the junk option alone: the precompiled validators
 * recognise that one by its own `$id` and answer it without a compiled function at all.
 *
 * @param schema - The schema that is about to be passed to `isValid()` for scoring
 * @returns - The schema to score, with an `$id` derived from its content unless it is the junk option
 */
function withScoringId<S extends StrictRJSFSchema = RJSFSchema>(schema: S): S {
  return schema[ID_KEY] === JUNK_OPTION_ID ? schema : withVariantId<S>(schema);
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
    } else if (option[PROPERTIES_KEY]) {
      // If the schema describes an object then we need to add slightly more
      // strict matching to the schema, because unless the schema uses the
      // "requires" keyword, an object will match the schema as long as it
      // doesn't have matching keys with a conflicting type. To do this we use an
      // "anyOf" with an array of requires. This augmentation expresses that the
      // schema should match if any of the keys in the schema are present on the
      // object and pass validation.
      //
      // Create an "anyOf" schema that requires at least one of the keys in the
      // "properties" object
      const requiresAnyOf = {
        anyOf: Object.keys(option[PROPERTIES_KEY]).map((key) => ({
          required: [key],
        })),
      };

      let augmentedSchema;

      // If the "anyOf" keyword already exists, wrap the augmentation in an "allOf"
      if (option.anyOf) {
        // Create a shallow clone of the option
        const { ...shallowClone } = option;

        if (!shallowClone.allOf) {
          shallowClone.allOf = [];
        } else {
          // If "allOf" already exists, shallow clone the array
          shallowClone.allOf = shallowClone.allOf.slice();
        }

        shallowClone.allOf.push(requiresAnyOf);

        augmentedSchema = shallowClone;
      } else {
        augmentedSchema = { ...option, ...requiresAnyOf };
      }

      // Remove the "required" field as it's likely that not all fields have
      // been filled in yet, which will mean that the schema is not valid
      delete augmentedSchema.required;

      if (context.validator.isValid(withScoringId(augmentedSchema), formData, rootSchema)) {
        return i;
      }
    } else if (context.validator.isValid(withScoringId(option), formData, rootSchema)) {
      // An option is scored as the caller hands it over, which for `MultiSchemaField` is the retrieved form rather
      // than the one the schema declares, so this needs the derived `$id` as much as the augmented branch does
      return i;
    }
  }
  return 0;
}
