import { ID_KEY, JUNK_OPTION_ID, PROPERTIES_KEY } from '../constants.ts';
import getOptionMatchingSimpleDiscriminator from '../getOptionMatchingSimpleDiscriminator.ts';
import hashForSchema from '../hashForSchema.ts';
import { getByPath } from '../pathUtils.ts';
import type { FormContextType, RJSFSchema, SchemaContext, StrictRJSFSchema } from '../types.ts';

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
  // A query may itself contain a `?`, so this resolves a relative `$ref` against the same base even when the original
  // `$id` already has one
  return { ...schema, [ID_KEY]: `${id}?rjsf=${hashForSchema(withoutId as S)}` };
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

      // The junk option is the exception to deriving an `$id`: the precompiled validators recognise it by its own
      // `$id` and answer it without a compiled function at all
      if (augmentedSchema[ID_KEY] !== JUNK_OPTION_ID) {
        augmentedSchema = withVariantId(augmentedSchema);
      }

      if (context.validator.isValid(augmentedSchema, formData, rootSchema)) {
        return i;
      }
    } else if (context.validator.isValid(option, formData, rootSchema)) {
      return i;
    }
  }
  return 0;
}
